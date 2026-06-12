package com.tropilot.service.impl;

import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.RoomMember;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.RoomMemberMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomMemberRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ActivityLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoomMemberServiceImplTest {

    @Mock
    private RoomMemberRepository roomMemberRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomMemberMapper roomMemberMapper;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private RoomMemberServiceImpl service;

    @Test
    void approveMemberChangesPendingMemberToApprovedWhenRoomHasCapacity() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        room.setMaxOccupants(3);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);
        RoomMember member = pendingMember(room, residentHead);

        when(roomMemberRepository.findByIdWithDetails(member.getId())).thenReturn(Optional.of(member));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);
        when(roomAssignmentRepository.findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));
        when(roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                residentHead.getId(),
                RoomMemberStatus.APPROVED
        )).thenReturn(1L);
        when(roomMemberRepository.save(any(RoomMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(roomMemberMapper.toResponse(any(RoomMember.class))).thenReturn(RoomMemberResponse.builder()
                .id(member.getId())
                .status(RoomMemberStatus.APPROVED)
                .build());

        RoomMemberResponse response = service.approveMember(member.getId(), room.getBuilding().getId());

        assertThat(response.getStatus()).isEqualTo(RoomMemberStatus.APPROVED);
        assertThat(member.getStatus()).isEqualTo(RoomMemberStatus.APPROVED);
        assertThat(member.getMoveOutDate()).isNull();
        verify(roomMemberRepository).save(member);
    }

    @Test
    void approveMemberRejectsApprovalWhenRoomCapacityWouldBeExceeded() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        room.setMaxOccupants(2);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);
        RoomMember member = pendingMember(room, residentHead);

        when(roomMemberRepository.findByIdWithDetails(member.getId())).thenReturn(Optional.of(member));
        when(buildingRepository.existsById(room.getBuilding().getId())).thenReturn(true);
        when(roomAssignmentRepository.findByRoomIdAndStatus(room.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));
        when(roomMemberRepository.countByRoom_IdAndResidentHead_IdAndStatus(
                room.getId(),
                residentHead.getId(),
                RoomMemberStatus.APPROVED
        )).thenReturn(1L);

        assertThatThrownBy(() -> service.approveMember(member.getId(), room.getBuilding().getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("maximum occupants");

        assertThat(member.getStatus()).isEqualTo(RoomMemberStatus.PENDING);
        verify(roomMemberRepository, never()).save(any(RoomMember.class));
    }

    private RoomMember pendingMember(Room room, User residentHead) {
        return RoomMember.builder()
                .id(700L)
                .room(room)
                .residentHead(residentHead)
                .fullName("Pending Member")
                .phone("0900000003")
                .email("pending@test.local")
                .identityNumber("987654321")
                .relationship("Family")
                .moveInDate(LocalDate.of(2026, 6, 1))
                .status(RoomMemberStatus.PENDING)
                .build();
    }
}
