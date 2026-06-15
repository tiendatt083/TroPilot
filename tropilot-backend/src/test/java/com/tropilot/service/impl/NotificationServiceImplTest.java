package com.tropilot.service.impl;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Notification;
import com.tropilot.entity.Room;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
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

    @Test
    void selectedUsersCanIncludeStaffAndResidentHeads() {
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        User staff = User.builder()
                .id(40L)
                .fullName("Staff")
                .email("staff@test.local")
                .password("hashed")
                .role(UserRole.STAFF)
                .status(UserStatus.ACTIVE)
                .build();
        Building building = BusinessRuleTestFixtures.building();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        RoomAssignment assignment = BusinessRuleTestFixtures.activeAssignment(room, residentHead);

        NotificationCreateRequest request = new NotificationCreateRequest();
        request.setTitle("Maintenance notice");
        request.setContent("Scheduled maintenance");
        request.setTargetType("SELECTED_USERS");
        request.setTargetUserIds(List.of(residentHead.getId(), staff.getId()));
        request.setBuildingTargetType("SELECTED");
        request.setBuildingIds(List.of(building.getId()));

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findAllById(List.of(residentHead.getId(), staff.getId())))
                .thenReturn(List.of(residentHead, staff));
        when(buildingRepository.findAllById(List.of(building.getId()))).thenReturn(List.of(building));
        when(roomAssignmentRepository.findByResidentHeadIdAndStatus(residentHead.getId(), RoomAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(notificationMapper.toResponse(any(Notification.class), isNull())).thenReturn(NotificationResponse.builder().id(99L).build());

        service.createNotification(request, admin.getId(), null);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification notification = captor.getValue();
        assertThat(notification.getTargetUsers())
                .extracting(targetUser -> targetUser.getUser().getId())
                .containsExactlyInAnyOrder(residentHead.getId(), staff.getId());
        assertThat(notification.getTargetBuildings())
                .extracting(targetBuilding -> targetBuilding.getBuilding().getId())
                .containsExactly(building.getId());
    }
}
