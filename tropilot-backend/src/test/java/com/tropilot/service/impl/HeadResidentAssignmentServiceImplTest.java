package com.tropilot.service.impl;

import com.tropilot.dto.request.AssignHeadResidentRequest;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
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
import com.tropilot.enums.VehicleOwnerType;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.enums.VehicleType;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.repository.VehicleRepository;
import com.tropilot.service.ActivityLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HeadResidentAssignmentServiceImplTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private RentalContractRepository rentalContractRepository;

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private HeadResidentAssignmentServiceImpl service;

    @Test
    void assignHeadResidentCreatesAssignmentContractAndClearsPreviousRoomArtifacts() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.EMPTY);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        LocalDate startDate = LocalDate.of(2026, 6, 1);
        LocalDate endDate = LocalDate.of(2026, 12, 1);
        AssignHeadResidentRequest request = assignmentRequest(residentHead.getId(), startDate, endDate);
        RoomMember previousMember = roomMember(room, residentHead, RoomMemberStatus.APPROVED);
        Vehicle previousVehicle = vehicle(room, VehicleStatus.ACTIVE);

        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(userRepository.findById(residentHead.getId())).thenReturn(Optional.of(residentHead));
        when(roomAssignmentRepository.existsByRoom_IdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(false);
        when(roomAssignmentRepository.existsByResidentHead_IdAndStatus(residentHead.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(false);
        when(roomMemberRepository.findByRoom_IdAndStatusIn(any(), anyList())).thenReturn(List.of(previousMember));
        when(vehicleRepository.findByRoom_IdAndStatusIn(any(), anyList())).thenReturn(List.of(previousVehicle));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomAssignmentRepository.save(any(RoomAssignment.class))).thenAnswer(invocation -> {
            RoomAssignment assignment = invocation.getArgument(0);
            assignment.setId(100L);
            return assignment;
        });
        when(rentalContractRepository.save(any(RentalContract.class))).thenAnswer(invocation -> {
            RentalContract contract = invocation.getArgument(0);
            contract.setId(200L);
            return contract;
        });

        HeadResidentAssignmentResponse response = service.assignHeadResident(room.getId(), request);

        assertThat(response.isAssigned()).isTrue();
        assertThat(response.getRoomStatus()).isEqualTo(RoomStatus.OCCUPIED);
        assertThat(room.getStatus()).isEqualTo(RoomStatus.OCCUPIED);
        assertThat(previousMember.getStatus()).isEqualTo(RoomMemberStatus.LEFT);
        assertThat(previousMember.getMoveOutDate()).isEqualTo(startDate);
        assertThat(previousVehicle.getStatus()).isEqualTo(VehicleStatus.INACTIVE);
        assertThat(previousVehicle.getEndDate()).isEqualTo(startDate);

        ArgumentCaptor<RoomAssignment> assignmentCaptor = ArgumentCaptor.forClass(RoomAssignment.class);
        ArgumentCaptor<RentalContract> contractCaptor = ArgumentCaptor.forClass(RentalContract.class);
        verify(roomAssignmentRepository).save(assignmentCaptor.capture());
        verify(rentalContractRepository).save(contractCaptor.capture());

        RoomAssignment savedAssignment = assignmentCaptor.getValue();
        assertThat(savedAssignment.getStatus()).isEqualTo(RoomAssignmentStatus.ACTIVE);
        assertThat(savedAssignment.getStartDate()).isEqualTo(startDate);
        assertThat(savedAssignment.getEndDate()).isEqualTo(endDate);

        RentalContract savedContract = contractCaptor.getValue();
        assertThat(savedContract.getRentalStatus()).isEqualTo(RentalStatus.ACTIVE);
        assertThat(savedContract.getContractStatus()).isEqualTo(ContractStatus.NOT_UPLOADED);
        assertThat(savedContract.getDepositAmount()).isEqualByComparingTo(room.getPrice());
    }

    @Test
    void removeHeadResidentEndsAssignmentContractMembersVehiclesAndEmptiesRoom() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);
        RentalContract contract = BusinessRuleTestFixtures.activeContract(room, residentHead);
        RoomMember member = roomMember(room, residentHead, RoomMemberStatus.APPROVED);
        Vehicle vehicle = vehicle(room, VehicleStatus.ACTIVE);

        when(roomRepository.findById(room.getId())).thenReturn(Optional.of(room));
        when(roomAssignmentRepository.findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));
        when(rentalContractRepository.findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
                room.getId(),
                residentHead.getId(),
                RentalStatus.ACTIVE
        )).thenReturn(Optional.of(contract));
        when(roomMemberRepository.findByRoom_IdAndStatusIn(any(), anyList())).thenReturn(List.of(member));
        when(vehicleRepository.findByRoom_IdAndStatusIn(any(), anyList())).thenReturn(List.of(vehicle));

        HeadResidentAssignmentResponse response = service.removeHeadResident(room.getId());

        assertThat(response.isAssigned()).isFalse();
        assertThat(room.getStatus()).isEqualTo(RoomStatus.EMPTY);
        assertThat(assignment.getStatus()).isEqualTo(RoomAssignmentStatus.ENDED);
        assertThat(contract.getRentalStatus()).isEqualTo(RentalStatus.ENDED);
        assertThat(member.getStatus()).isEqualTo(RoomMemberStatus.LEFT);
        assertThat(member.getMoveOutDate()).isEqualTo(LocalDate.now());
        assertThat(vehicle.getStatus()).isEqualTo(VehicleStatus.INACTIVE);
        assertThat(vehicle.getEndDate()).isEqualTo(LocalDate.now());
        verify(roomRepository).save(room);
        verify(roomAssignmentRepository).save(assignment);
        verify(rentalContractRepository).save(contract);
    }

    private AssignHeadResidentRequest assignmentRequest(Long residentHeadId, LocalDate startDate, LocalDate endDate) {
        AssignHeadResidentRequest request = new AssignHeadResidentRequest();
        request.setResidentHeadId(residentHeadId);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        return request;
    }

    private RoomMember roomMember(Room room, User residentHead, RoomMemberStatus status) {
        return RoomMember.builder()
                .id(500L)
                .room(room)
                .residentHead(residentHead)
                .fullName("Room Member")
                .phone("0900000002")
                .email("member@test.local")
                .identityNumber("123456789")
                .relationship("Family")
                .moveInDate(LocalDate.of(2026, 1, 1))
                .status(status)
                .build();
    }

    private Vehicle vehicle(Room room, VehicleStatus status) {
        return Vehicle.builder()
                .id(600L)
                .room(room)
                .ownerName("Resident Head")
                .ownerType(VehicleOwnerType.RESIDENT_HEAD)
                .vehicleType(VehicleType.MOTORBIKE)
                .licensePlate("29A-12345")
                .startDate(LocalDate.of(2026, 1, 1))
                .status(status)
                .build();
    }
}
