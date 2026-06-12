package com.tropilot.service.impl;

import com.tropilot.entity.User;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.mapper.NotificationMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.NotificationReadRepository;
import com.tropilot.repository.NotificationRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ResidentRoomAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationReadRepository notificationReadRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private ResidentRoomAccessService residentRoomAccessService;

    @InjectMocks
    private NotificationServiceImpl service;

    @Test
    void residentWithoutRoomCannotLoadNotifications() {
        User residentHead = BusinessRuleTestFixtures.residentHead();
        ForbiddenException exception =
                new ForbiddenException("An active room assignment is required to use resident features");

        when(userRepository.findById(residentHead.getId())).thenReturn(Optional.of(residentHead));
        when(residentRoomAccessService.requireActiveAssignment(residentHead.getId())).thenThrow(exception);

        assertThatThrownBy(() -> service.getResidentNotifications(residentHead.getId()))
                .isSameAs(exception);
        verify(residentRoomAccessService).requireActiveAssignment(residentHead.getId());
    }

    @Test
    void residentWithoutRoomCannotMarkNotificationAsRead() {
        User residentHead = BusinessRuleTestFixtures.residentHead();
        ForbiddenException exception =
                new ForbiddenException("An active room assignment is required to use resident features");

        when(userRepository.findById(residentHead.getId())).thenReturn(Optional.of(residentHead));
        when(residentRoomAccessService.requireActiveAssignment(residentHead.getId())).thenThrow(exception);

        assertThatThrownBy(() -> service.markRead(residentHead.getId(), 99L))
                .isSameAs(exception);
        verify(residentRoomAccessService).requireActiveAssignment(residentHead.getId());
    }
}
