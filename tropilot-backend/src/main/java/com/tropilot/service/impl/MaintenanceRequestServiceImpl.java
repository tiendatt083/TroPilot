package com.tropilot.service.impl;

import com.tropilot.dto.request.MaintenanceAssignRequest;
import com.tropilot.dto.request.MaintenanceCompleteRequest;
import com.tropilot.dto.request.MaintenanceRejectRequest;
import com.tropilot.dto.request.MaintenanceRequestCreateRequest;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.MaintenanceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MaintenanceRequestServiceImpl implements MaintenanceRequestService {

    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final UserRepository userRepository;
    private final MaintenanceImageStorageService maintenanceImageStorageService;
    private final MaintenanceRequestMapper maintenanceRequestMapper;

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
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .imageUrl(imageUrl)
                .status(MaintenanceStatus.PENDING)
                .build();

        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
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
    public List<MaintenanceRequestResponse> getRequests() {
        return maintenanceRequestRepository.findAllWithDetails()
                .stream()
                .map(maintenanceRequestMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse assignRequest(Long id, MaintenanceAssignRequest request) {
        MaintenanceRequest maintenanceRequest = findRequest(id);

        if (maintenanceRequest.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BadRequestException("Completed maintenance requests cannot be reassigned");
        }

        User assignedTo = findActiveStaff(request.getAssignedToId());
        maintenanceRequest.setAssignedTo(assignedTo);
        maintenanceRequest.setStatus(MaintenanceStatus.ASSIGNED);

        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> getStaffRequests(Long staffId) {
        return maintenanceRequestRepository.findByAssignedToIdWithDetails(staffId)
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

        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
    }

    @Override
    @Transactional
    public MaintenanceRequestResponse rejectRequest(Long staffId, Long id, MaintenanceRejectRequest request) {
        MaintenanceRequest maintenanceRequest = findAssignedRequest(staffId, id);

        if (maintenanceRequest.getStatus() == MaintenanceStatus.COMPLETED) {
            throw new BadRequestException("Completed maintenance requests cannot be rejected");
        }

        if (maintenanceRequest.getStatus() == MaintenanceStatus.PENDING) {
            throw new BadRequestException("Pending maintenance requests must be assigned before rejection");
        }

        maintenanceRequest.setStatus(MaintenanceStatus.REJECTED);
        if (request != null && request.getResultNote() != null && !request.getResultNote().isBlank()) {
            maintenanceRequest.setResultNote(request.getResultNote().trim());
        }

        return maintenanceRequestMapper.toResponse(maintenanceRequestRepository.save(maintenanceRequest));
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
        boolean sameRoom = request.getRoom().getId().equals(assignment.getRoom().getId());
        boolean sameResidentHead = request.getResidentHead().getId().equals(assignment.getResidentHead().getId());

        if (!sameRoom || !sameResidentHead) {
            throw new ForbiddenException("Maintenance request does not belong to the current Head Resident room");
        }
    }
}
