package com.tropilot.service.impl;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.RoomMember;
import com.tropilot.entity.User;
import com.tropilot.entity.Vehicle;
import com.tropilot.enums.ContractStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.HeadResidentAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HeadResidentAssignmentServiceImpl implements HeadResidentAssignmentService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final RentalContractRepository rentalContractRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final VehicleRepository vehicleRepository;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public HeadResidentAssignmentResponse assignHeadResident(Long roomId, AssignHeadResidentRequest request) {
        Room room = findRoom(roomId);
        User residentHead = findUser(request.getResidentHeadId());

        validateResidentHead(residentHead);
        validateAssignmentDates(request);

        if (room.getStatus() != RoomStatus.EMPTY) {
            throw new BadRequestException("Only empty rooms can receive a Head Resident");
        }

        if (roomAssignmentRepository.existsByRoom_IdAndStatus(roomId, RoomAssignmentStatus.ACTIVE)) {
            throw new BadRequestException("Room already has an active Head Resident");
        }

        if (roomAssignmentRepository.existsByResidentHead_IdAndStatus(
                residentHead.getId(),
                RoomAssignmentStatus.ACTIVE
        )) {
            throw new BadRequestException("Head Resident is already assigned to another active room");
        }

        markRoomMembersAsLeft(room.getId(), request.getStartDate());
        deleteRoomVehicles(room.getId());

        RoomAssignment assignment = RoomAssignment.builder()
                .room(room)
                .residentHead(residentHead)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(RoomAssignmentStatus.ACTIVE)
                .build();

        RentalContract contract = RentalContract.builder()
                .room(room)
                .residentHead(residentHead)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .depositAmount(room.getPrice())
                .rentalStatus(RentalStatus.ACTIVE)
                .contractStatus(ContractStatus.NOT_UPLOADED)
                .build();

        room.setStatus(RoomStatus.OCCUPIED);

        Room savedRoom = roomRepository.save(room);
        RoomAssignment savedAssignment = roomAssignmentRepository.save(assignment);
        RentalContract savedContract = rentalContractRepository.save(contract);
        activityLogService.recordCurrentUser(
                "HEAD_RESIDENT_ASSIGNED",
                "Assigned Head Resident " + residentHead.getEmail() + " to room " + savedRoom.getRoomCode()
        );

        return toAssignedResponse(savedRoom, savedAssignment, savedContract);
    }

    @Override
    @Transactional(readOnly = true)
    public HeadResidentAssignmentResponse getHeadResidentAssignment(Long roomId) {
        Room room = findRoom(roomId);

        return roomAssignmentRepository.findByRoomIdAndStatus(roomId, RoomAssignmentStatus.ACTIVE)
                .map(assignment -> toAssignedResponse(
                        assignment.getRoom(),
                        assignment,
                        findActiveOrLatestContract(assignment)
                ))
                .orElseGet(() -> toUnassignedResponse(room));
    }

    @Override
    @Transactional
    public HeadResidentAssignmentResponse removeHeadResident(Long roomId) {
        Room room = findRoom(roomId);
        RoomAssignment assignment = roomAssignmentRepository
                .findByRoomIdAndStatus(roomId, RoomAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException("Room does not have an active Head Resident"));

        LocalDate removalDate = LocalDate.now();
        assignment.setStatus(RoomAssignmentStatus.ENDED);
        if (assignment.getEndDate().isAfter(removalDate)) {
            assignment.setEndDate(removalDate);
        }

        RentalContract contract = findActiveOrLatestContract(assignment);
        if (contract != null && contract.getRentalStatus() == RentalStatus.ACTIVE) {
            contract.setRentalStatus(RentalStatus.ENDED);
            if (contract.getEndDate().isAfter(removalDate)) {
                contract.setEndDate(removalDate);
            }
            rentalContractRepository.save(contract);
        }

        markRoomMembersAsLeft(room.getId(), removalDate);
        deleteRoomVehicles(room.getId());

        room.setStatus(RoomStatus.EMPTY);
        roomRepository.save(room);
        roomAssignmentRepository.save(assignment);

        return toUnassignedResponse(room);
    }

    @Override
    @Transactional(readOnly = true)
    public HeadResidentAssignmentResponse getResidentAssignedRoom(Long residentHeadId) {
        return roomAssignmentRepository
                .findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .map(assignment -> toAssignedResponse(
                        assignment.getRoom(),
                        assignment,
                        findActiveOrLatestContract(assignment)
                ))
                .orElseGet(() -> HeadResidentAssignmentResponse.builder().assigned(false).build());
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateResidentHead(User user) {
        if (user.getRole() != UserRole.RESIDENT_HEAD) {
            throw new BadRequestException("Selected user must be a Head Resident");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Head Resident account must be active");
        }
    }

    private void validateAssignmentDates(AssignHeadResidentRequest request) {
        if (!request.getStartDate().isBefore(request.getEndDate())) {
            throw new BadRequestException("Start date must be before end date");
        }
    }

    private RentalContract findActiveOrLatestContract(RoomAssignment assignment) {
        Long roomId = assignment.getRoom().getId();
        Long residentHeadId = assignment.getResidentHead().getId();

        return rentalContractRepository
                .findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
                        roomId,
                        residentHeadId,
                        RentalStatus.ACTIVE
                )
                .or(() -> rentalContractRepository.findFirstByRoom_IdAndResidentHead_IdOrderByCreatedAtDesc(
                        roomId,
                        residentHeadId
                ))
                .orElse(null);
    }

    private void markRoomMembersAsLeft(Long roomId, LocalDate moveOutDate) {
        List<RoomMember> members = roomMemberRepository.findByRoom_IdAndStatusIn(
                roomId,
                List.of(RoomMemberStatus.PENDING, RoomMemberStatus.APPROVED)
        );

        members.forEach(member -> {
            member.setStatus(RoomMemberStatus.LEFT);
            if (member.getMoveOutDate() == null || member.getMoveOutDate().isAfter(moveOutDate)) {
                member.setMoveOutDate(moveOutDate);
            }
        });

        roomMemberRepository.saveAll(members);
    }

    private void deleteRoomVehicles(Long roomId) {
        List<Vehicle> vehicles = vehicleRepository.findByRoomIdWithDetails(roomId);
        vehicleRepository.deleteAll(vehicles);
    }

    private HeadResidentAssignmentResponse toAssignedResponse(
            Room room,
            RoomAssignment assignment,
            RentalContract contract
    ) {
        Building building = room.getBuilding();
        User residentHead = assignment.getResidentHead();
        HeadResidentAssignmentResponse.HeadResidentAssignmentResponseBuilder builder =
                HeadResidentAssignmentResponse.builder()
                .assigned(true)
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .roomStatus(room.getStatus())
                .roomPrice(room.getPrice())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .residentHeadPhone(residentHead.getPhone())
                .assignmentId(assignment.getId())
                .assignmentStartDate(assignment.getStartDate())
                .assignmentEndDate(assignment.getEndDate())
                .assignmentStatus(assignment.getStatus());

        if (contract != null) {
            builder.contractId(contract.getId())
                    .contractStartDate(contract.getStartDate())
                    .contractEndDate(contract.getEndDate())
                    .depositAmount(contract.getDepositAmount())
                    .rentalStatus(contract.getRentalStatus())
                    .contractFileUrl(contract.getContractFileUrl())
                    .contractStatus(contract.getContractStatus());
        }

        return builder.build();
    }

    private HeadResidentAssignmentResponse toUnassignedResponse(Room room) {
        Building building = room.getBuilding();

        return HeadResidentAssignmentResponse.builder()
                .assigned(false)
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .roomStatus(room.getStatus())
                .roomPrice(room.getPrice())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .build();
    }
}
