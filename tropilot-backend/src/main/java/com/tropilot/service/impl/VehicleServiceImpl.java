package com.tropilot.service.impl;

import com.tropilot.dto.request.VehicleRequest;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.Vehicle;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.VehicleOwnerType;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.enums.VehicleType;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final BuildingRepository buildingRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    @Transactional
    public VehicleResponse requestVehicle(Long residentHeadId, VehicleRequest request) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        VehicleOwnerType ownerType = parseOwnerType(request.getOwnerType());
        VehicleType vehicleType = parseVehicleType(request.getVehicleType());
        String licensePlate = normalizeLicensePlate(request.getLicensePlate());

        validateActiveLicensePlateAvailability(licensePlate);
        validateDates(request.getStartDate(), request.getEndDate());

        Vehicle vehicle = Vehicle.builder()
                .room(assignment.getRoom())
                .ownerName(resolveOwnerName(assignment, ownerType, request.getOwnerName()))
                .ownerType(ownerType)
                .vehicleType(vehicleType)
                .licensePlate(licensePlate)
                .brand(normalizeOptionalText(request.getBrand()))
                .color(normalizeOptionalText(request.getColor()))
                .startDate(resolveStartDate(request.getStartDate()))
                .endDate(request.getEndDate())
                .status(VehicleStatus.PENDING)
                .build();

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getResidentVehicles(Long residentHeadId) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);

        return vehicleRepository.findByRoomIdWithDetails(assignment.getRoom().getId())
                .stream()
                .map(vehicleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public VehicleResponse requestCancel(Long residentHeadId, Long id) {
        RoomAssignment assignment = findActiveAssignment(residentHeadId);
        Vehicle vehicle = findVehicle(id);
        validateVehicleRoom(vehicle, assignment.getRoom());

        if (vehicle.getStatus() == VehicleStatus.INACTIVE) {
            throw new BadRequestException("Vehicle is already inactive");
        }

        if (vehicle.getStatus() == VehicleStatus.REJECTED) {
            throw new BadRequestException("Rejected vehicles cannot be cancelled");
        }

        vehicle.setStatus(VehicleStatus.INACTIVE);
        vehicle.setEndDate(LocalDate.now());

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehicles(Long buildingId) {
        List<Vehicle> vehicles = buildingId == null
                ? vehicleRepository.findAllWithDetails()
                : getBuildingVehicles(buildingId);

        return vehicles
                .stream()
                .map(vehicleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleResponse> getPendingVehicles(Long buildingId) {
        List<Vehicle> vehicles = buildingId == null
                ? vehicleRepository.findByStatusWithDetails(VehicleStatus.PENDING)
                : getBuildingVehiclesByStatus(buildingId, VehicleStatus.PENDING);

        return vehicles
                .stream()
                .map(vehicleMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public VehicleResponse approveVehicle(Long id, Long buildingId) {
        Vehicle vehicle = findVehicle(id);
        validateVehicleBelongsToBuilding(vehicle, buildingId);

        if (vehicle.getStatus() != VehicleStatus.PENDING) {
            throw new BadRequestException("Only pending vehicles can be approved");
        }

        if (vehicleRepository.existsByLicensePlateAndStatusAndIdNot(
                vehicle.getLicensePlate(),
                VehicleStatus.ACTIVE,
                id
        )) {
            throw new BadRequestException("License plate is already active");
        }

        vehicle.setStatus(VehicleStatus.ACTIVE);
        vehicle.setEndDate(null);

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleResponse rejectVehicle(Long id, Long buildingId) {
        Vehicle vehicle = findVehicle(id);
        validateVehicleBelongsToBuilding(vehicle, buildingId);

        if (vehicle.getStatus() != VehicleStatus.PENDING) {
            throw new BadRequestException("Only pending vehicles can be rejected");
        }

        vehicle.setStatus(VehicleStatus.REJECTED);

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    @Override
    @Transactional
    public VehicleResponse deactivateVehicle(Long id, Long buildingId) {
        Vehicle vehicle = findVehicle(id);
        validateVehicleBelongsToBuilding(vehicle, buildingId);

        if (vehicle.getStatus() == VehicleStatus.REJECTED) {
            throw new BadRequestException("Rejected vehicles cannot be deactivated");
        }

        if (vehicle.getStatus() == VehicleStatus.INACTIVE) {
            throw new BadRequestException("Vehicle is already inactive");
        }

        vehicle.setStatus(VehicleStatus.INACTIVE);
        vehicle.setEndDate(LocalDate.now());

        return vehicleMapper.toResponse(vehicleRepository.save(vehicle));
    }

    private RoomAssignment findActiveAssignment(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Head Resident must have an active room"));
    }

    private Vehicle findVehicle(Long id) {
        return vehicleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));
    }

    private List<Vehicle> getBuildingVehicles(Long buildingId) {
        validateBuildingExists(buildingId);
        return vehicleRepository.findByBuildingIdWithDetails(buildingId);
    }

    private List<Vehicle> getBuildingVehiclesByStatus(Long buildingId, VehicleStatus status) {
        validateBuildingExists(buildingId);
        return vehicleRepository.findByBuildingIdAndStatusWithDetails(buildingId, status);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private void validateVehicleBelongsToBuilding(Vehicle vehicle, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(vehicle.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Vehicle does not belong to the selected building");
        }
    }

    private void validateVehicleRoom(Vehicle vehicle, Room room) {
        if (!vehicle.getRoom().getId().equals(room.getId())) {
            throw new ForbiddenException("Vehicle does not belong to the current Head Resident room");
        }
    }

    private void validateActiveLicensePlateAvailability(String licensePlate) {
        if (vehicleRepository.existsByLicensePlateAndStatus(licensePlate, VehicleStatus.ACTIVE)) {
            throw new BadRequestException("License plate is already active");
        }
    }

    private void validateDates(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && !startDate.isBefore(endDate)) {
            throw new BadRequestException("Start date must be before end date");
        }
    }

    private String resolveOwnerName(RoomAssignment assignment, VehicleOwnerType ownerType, String ownerName) {
        if (ownerType == VehicleOwnerType.RESIDENT_HEAD) {
            return assignment.getResidentHead().getFullName();
        }

        String normalizedOwnerName = normalizeOptionalText(ownerName);
        if (normalizedOwnerName == null) {
            throw new BadRequestException("Owner name is required for room member vehicles");
        }

        boolean approvedMemberExists = roomMemberRepository.existsByRoom_IdAndResidentHead_IdAndStatusAndFullNameIgnoreCase(
                assignment.getRoom().getId(),
                assignment.getResidentHead().getId(),
                RoomMemberStatus.APPROVED,
                normalizedOwnerName
        );

        if (!approvedMemberExists) {
            throw new BadRequestException("Owner name must match an approved room member");
        }

        return normalizedOwnerName;
    }

    private LocalDate resolveStartDate(LocalDate startDate) {
        return startDate == null ? LocalDate.now() : startDate;
    }

    private VehicleOwnerType parseOwnerType(String ownerType) {
        try {
            return VehicleOwnerType.valueOf(ownerType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid vehicle owner type");
        }
    }

    private VehicleType parseVehicleType(String vehicleType) {
        try {
            return VehicleType.valueOf(vehicleType.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Invalid vehicle type");
        }
    }

    private String normalizeLicensePlate(String licensePlate) {
        return licensePlate.trim().toUpperCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
