package com.tropilot.service.impl;

import com.tropilot.storage.MaintenanceImageStorageService;
import com.tropilot.mapper.MaintenanceRequestMapper;
import com.tropilot.dto.request.MaintenanceAssignRequest;
import com.tropilot.dto.request.MaintenanceCompleteRequest;
import com.tropilot.dto.request.MaintenanceRequestCreateRequest;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.entity.Equipment;
import com.tropilot.entity.EquipmentMaintenanceHistory;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.EquipmentCondition;
import com.tropilot.enums.EquipmentScope;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.EquipmentMaintenanceHistoryRepository;
import com.tropilot.repository.EquipmentRepository;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.MaintenanceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class MaintenanceRequestServiceImpl implements MaintenanceRequestService {

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final EquipmentRepository equipmentRepository;
    private final EquipmentMaintenanceHistoryRepository equipmentMaintenanceHistoryRepository;
    private final BuildingRepository buildingRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final UserRepository userRepository;
    private final MaintenanceImageStorageService maintenanceImageStorageService;
    private final MaintenanceRequestMapper maintenanceRequestMapper;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public MaintenanceRequestResponse createResidentRequest(
            Long residentHeadId,
            MaintenanceRequestCreateRequest request
    ) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        String imageUrl = maintenanceImageStorageService.store(request.getImage());

        MaintenanceRequest maintenanceRequest = MaintenanceRequest.builder()
                .room(assignment.getRoom())
                .residentHead(assignment.getResidentHead())
                .building(assignment.getRoom().getBuilding())
                .requestedBy(assignment.getResidentHead())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .imageUrl(imageUrl)
                .status(MaintenanceStatus.PENDING)
                .build();

        MaintenanceRequest savedRequest = maintenanceRequestRepository.save(maintenanceRequest);
        activityLogService.record(
                assignment.getResidentHead(),
                "MAINTENANCE_REQUEST_CREATED",
                "Created maintenance request " + savedRequest.getTitle()
                        + " for room " + assignment.getRoom().getRoomCode()
        );

        return maintenanceRequestMapper.toResponse(savedRequest);
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse createEquipmentRequest(
            Long requestedById,
            Long equipmentId,
            MaintenanceRequestCreateRequest request
    ) {
        User requestedBy = findUser(requestedById);
        Equipment equipment = findEquipment(equipmentId);

        if (equipment.getCondition() == EquipmentCondition.INACTIVE) {
            throw new BadRequestException("Inactive equipment cannot receive maintenance requests");
        }

        if (maintenanceRequestRepository.existsByEquipment_IdAndStatusIn(
                equipmentId,
                List.of(
                        MaintenanceStatus.PENDING,
                        MaintenanceStatus.ASSIGNED,
                        MaintenanceStatus.IN_PROGRESS
                )
        )) {
            throw new BadRequestException("Equipment already has an active maintenance request");
        }

        Room room = equipment.getRoom();
        User residentHead = null;

        if (requestedBy.getRole() == UserRole.RESIDENT_HEAD) {
            RoomAssignment assignment = findActiveAssignment(requestedById);
            validateResidentEquipmentAccess(equipment, assignment);
            residentHead = assignment.getResidentHead();
        } else if (requestedBy.getRole() == UserRole.ADMIN || requestedBy.getRole() == UserRole.STAFF) {
            if (room != null) {
                residentHead = roomAssignmentRepository
                        .findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE)
                        .map(RoomAssignment::getResidentHead)
                        .orElse(null);
            }
        } else {
            throw new ForbiddenException("Current user cannot request equipment maintenance");
        }

        User assignedTo = null;
        MaintenanceStatus initialStatus = MaintenanceStatus.PENDING;
        if (requestedBy.getRole() == UserRole.ADMIN) {
            if (request.getAssignedToId() == null) {
                throw new BadRequestException("Assigned staff is required for admin-created maintenance requests");
            }
            assignedTo = findActiveStaff(request.getAssignedToId());
            initialStatus = MaintenanceStatus.ASSIGNED;
        } else if (request.getAssignedToId() != null) {
            if (requestedBy.getRole() != UserRole.ADMIN) {
                throw new ForbiddenException("Only admins can assign equipment maintenance on creation");
            }
            assignedTo = findActiveStaff(request.getAssignedToId());
            initialStatus = MaintenanceStatus.ASSIGNED;
        }

        String imageUrl = maintenanceImageStorageService.store(request.getImage());
        MaintenanceRequest maintenanceRequest = MaintenanceRequest.builder()
                .room(room)
                .residentHead(residentHead)
                .building(equipment.getBuilding())
                .equipment(equipment)
                .requestedBy(requestedBy)
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .imageUrl(imageUrl)
                .assignedTo(assignedTo)
                .status(initialStatus)
                .build();

        if (equipment.getCondition() != EquipmentCondition.BROKEN) {
            equipment.setCondition(EquipmentCondition.NEEDS_MAINTENANCE);
            equipmentRepository.save(equipment);
        }

        MaintenanceRequest savedRequest = maintenanceRequestRepository.save(maintenanceRequest);
        activityLogService.record(
                requestedBy,
                "EQUIPMENT_MAINTENANCE_REQUEST_CREATED",
                "Created maintenance request for equipment " + equipment.getEquipmentCode()
        );
        return maintenanceRequestMapper.toResponse(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getResidentRequests(Long residentHeadId) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);

        return maintenanceRequestRepository
                .findByRoomIdAndResidentHeadIdWithDetails(assignment.getRoom().getId(), residentHeadId)
                .stream()
                .map(maintenanceRequestMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceRequestResponse getResidentRequest(Long residentHeadId, Long id) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        MaintenanceRequest maintenanceRequest = findRequest(id);
        validateResidentOwnership(maintenanceRequest, assignment);

        return maintenanceRequestMapper.toResponse(maintenanceRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getRequests(Long buildingId) {
        List<MaintenanceRequest> requests = buildingId == null
                ? maintenanceRequestRepository.findAllWithDetails()
                : getBuildingRequests(buildingId);

        return requests
                .stream()
                .map(maintenanceRequestMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse assignRequest(Long id, MaintenanceAssignRequest request, Long buildingId) {
        MaintenanceRequest maintenanceRequest = findRequest(id);
        validateRequestBelongsToBuilding(maintenanceRequest, buildingId);

        if (maintenanceRequest.getStatus() != MaintenanceStatus.PENDING
                && maintenanceRequest.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new BadRequestException("Only pending or assigned maintenance requests can be reassigned");
        }

        User assignedTo = findActiveStaff(request.getAssignedToId());
        maintenanceRequest.setAssignedTo(assignedTo);
        maintenanceRequest.setStatus(MaintenanceStatus.ASSIGNED);

        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getStaffRequests(Long staffId, Long buildingId) {
        List<MaintenanceRequest> requests = buildingId == null
                ? maintenanceRequestRepository.findByAssignedToIdWithDetails(staffId)
                : getStaffBuildingRequests(staffId, buildingId);

        return requests
                .stream()
                .map(maintenanceRequestMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse startRequest(Long staffId, Long id) {
        MaintenanceRequest maintenanceRequest = findAssignedRequest(staffId, id);

        if (maintenanceRequest.getStatus() != MaintenanceStatus.ASSIGNED) {
            throw new BadRequestException("Only assigned maintenance requests can be started");
        }

        maintenanceRequest.setStatus(MaintenanceStatus.IN_PROGRESS);
        if (maintenanceRequest.getEquipment() != null) {
            maintenanceRequest.getEquipment().setCondition(EquipmentCondition.UNDER_MAINTENANCE);
            equipmentRepository.save(maintenanceRequest.getEquipment());
        }
        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse completeRequest(Long staffId, Long id, MaintenanceCompleteRequest request) {
        MaintenanceRequest maintenanceRequest = findAssignedRequest(staffId, id);

        if (maintenanceRequest.getStatus() != MaintenanceStatus.IN_PROGRESS) {
            throw new BadRequestException("Only in-progress maintenance requests can be completed");
        }

        String resultImageUrl = maintenanceImageStorageService.store(request.getResultImage());
        maintenanceRequest.setStatus(MaintenanceStatus.COMPLETED);
        maintenanceRequest.setResultNote(request.getResultNote().trim());

        if (resultImageUrl != null) {
            maintenanceRequest.setResultImageUrl(resultImageUrl);
        }

        MaintenanceRequest savedRequest = maintenanceRequestRepository.save(maintenanceRequest);
        completeEquipmentMaintenance(savedRequest);
        activityLogService.record(
                savedRequest.getAssignedTo(),
                "MAINTENANCE_REQUEST_COMPLETED",
                "Completed maintenance request " + savedRequest.getTitle()
                        + " for " + describeRequestLocation(savedRequest)
        );

        return maintenanceRequestMapper.toResponse(savedRequest);
    }

    private RoomAssignment findActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }

    private MaintenanceRequest findAssignedRequest(Long staffId, Long id) {
        MaintenanceRequest maintenanceRequest = findRequest(id);

        if (maintenanceRequest.getAssignedTo() == null
                || !maintenanceRequest.getAssignedTo().getId().equals(staffId)) {
            throw new ForbiddenException("Maintenance request is not assigned to the current staff user");
        }

        return maintenanceRequest;
    }

    private MaintenanceRequest findRequest(Long id) {
        return maintenanceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found"));
    }

    private Equipment findEquipment(Long id) {
        return equipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment not found"));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private List<MaintenanceRequest> getBuildingRequests(Long buildingId) {
        validateBuildingExists(buildingId);
        return maintenanceRequestRepository.findByBuildingIdWithDetails(buildingId);
    }

    private List<MaintenanceRequest> getStaffBuildingRequests(Long staffId, Long buildingId) {
        validateBuildingExists(buildingId);
        return maintenanceRequestRepository.findByAssignedToIdAndBuildingIdWithDetails(staffId, buildingId);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateRequestBelongsToBuilding(MaintenanceRequest request, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        Long requestBuildingId = request.getBuilding() != null
                ? request.getBuilding().getId()
                : request.getRoom() == null ? null : request.getRoom().getBuilding().getId();

        if (!Objects.equals(requestBuildingId, buildingId)) {
            throw new BadRequestException("Maintenance request does not belong to the selected building");
        }
    }

    private User findActiveStaff(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() != UserRole.STAFF) {
            throw new BadRequestException("Assigned user must be a staff user");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Assigned staff account must be active");
        }

        return user;
    }

    private void validateResidentOwnership(MaintenanceRequest request, RoomAssignment assignment) {
        boolean sameRoom = request.getRoom() != null
                && request.getRoom().getId().equals(assignment.getRoom().getId());
        boolean sameResidentHead = request.getResidentHead() != null
                && request.getResidentHead().getId().equals(assignment.getResidentHead().getId());
        boolean requestedEquipmentMaintenance = request.getEquipment() != null
                && request.getRequestedBy() != null
                && request.getRequestedBy().getId().equals(assignment.getResidentHead().getId());

        if ((!sameRoom || !sameResidentHead) && !requestedEquipmentMaintenance) {
            throw new ForbiddenException("Maintenance request does not belong to the current Head Resident room");
        }
    }

    private void validateResidentEquipmentAccess(Equipment equipment, RoomAssignment assignment) {
        if (!Objects.equals(equipment.getBuilding().getId(), assignment.getRoom().getBuilding().getId())) {
            throw new ForbiddenException("Equipment does not belong to the current Head Resident building");
        }

        if (equipment.getScope() != EquipmentScope.ROOM) {
            throw new ForbiddenException("Head Resident can only request maintenance for room equipment");
        }

        if (equipment.getRoom() == null
                || !Objects.equals(equipment.getRoom().getId(), assignment.getRoom().getId())) {
            throw new ForbiddenException("Room equipment does not belong to the current Head Resident room");
        }
    }

    private void completeEquipmentMaintenance(MaintenanceRequest maintenanceRequest) {
        Equipment equipment = maintenanceRequest.getEquipment();
        if (equipment == null) {
            return;
        }

        LocalDate maintenanceDate = LocalDate.now();
        equipment.setCondition(EquipmentCondition.GOOD);
        equipment.setLastMaintenanceDate(maintenanceDate);
        equipmentRepository.save(equipment);

        if (!equipmentMaintenanceHistoryRepository.existsByMaintenanceRequest_Id(maintenanceRequest.getId())) {
            equipmentMaintenanceHistoryRepository.save(
                    EquipmentMaintenanceHistory.builder()
                            .equipment(equipment)
                            .maintenanceRequest(maintenanceRequest)
                            .maintenanceDate(maintenanceDate)
                            .resultNote(maintenanceRequest.getResultNote())
                            .resultImageUrl(maintenanceRequest.getResultImageUrl())
                            .performedBy(maintenanceRequest.getAssignedTo())
                            .build()
            );
        }
    }

    private String describeRequestLocation(MaintenanceRequest request) {
        if (request.getEquipment() != null) {
            return "equipment " + request.getEquipment().getEquipmentCode();
        }
        if (request.getRoom() != null) {
            return "room " + request.getRoom().getRoomCode();
        }
        return "building " + (request.getBuilding() == null ? "unknown" : request.getBuilding().getBuildingCode());
    }
}
