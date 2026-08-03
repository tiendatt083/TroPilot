package com.tropilot.service.impl;

import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.repository.RoomAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra truy vấn phân phòng ACTIVE và lỗi khi chủ hộ không còn phòng hợp lệ. */
class ResidentRoomAccessServiceImplTest {

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @InjectMocks
    private ResidentRoomAccessServiceImpl service;

    @Test
    void requireActiveAssignmentReturnsCurrentAssignment() {
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        User residentHead = BusinessRuleTestFixtures.residentHead();
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);

        when(roomAssignmentRepository.findByResidentHeadIdAndStatus(
                residentHead.getId(),
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(Optional.of(assignment));

        assertThat(service.requireActiveAssignment(residentHead.getId())).isSameAs(assignment);
    }

    @Test
    void requireActiveAssignmentRejectsResidentWithoutRoom() {
        Long residentHeadId = BusinessRuleTestFixtures.RESIDENT_ID;

        when(roomAssignmentRepository.findByResidentHeadIdAndStatus(
                residentHeadId,
                RoomAssignmentStatus.ACTIVE
        )).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireActiveAssignment(residentHeadId))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage(ResidentRoomAccessServiceImpl.ACTIVE_ROOM_REQUIRED_MESSAGE);
    }
}
