package com.tropilot.mapper;

import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Notification;
import com.tropilot.entity.NotificationRead;
import com.tropilot.entity.NotificationTargetBuilding;
import com.tropilot.entity.NotificationTargetUser;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification, NotificationRead read) {
        User createdBy = notification.getCreatedBy();

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .targetType(notification.getTargetType())
                .targetId(notification.getTargetId())
                .targetUserIds(notification.getTargetUsers()
                        .stream()
                        .map(NotificationTargetUser::getUser)
                        .map(User::getId)
                        .toList())
                .targetUserNames(notification.getTargetUsers()
                        .stream()
                        .map(NotificationTargetUser::getUser)
                        .map(User::getFullName)
                        .toList())
                .allBuildings(notification.getTargetBuildings().isEmpty())
                .buildingIds(notification.getTargetBuildings()
                        .stream()
                        .map(NotificationTargetBuilding::getBuilding)
                        .map(building -> building.getId())
                        .toList())
                .buildingNames(notification.getTargetBuildings()
                        .stream()
                        .map(NotificationTargetBuilding::getBuilding)
                        .map(building -> building.getBuildingCode() + " - " + building.getName())
                        .toList())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(notification.getCreatedAt())
                .read(read != null)
                .readAt(read == null ? null : read.getReadAt())
                .build();
    }
}
