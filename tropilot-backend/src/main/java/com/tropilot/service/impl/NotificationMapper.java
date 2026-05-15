package com.tropilot.service.impl;

import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Notification;
import com.tropilot.entity.NotificationRead;
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
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(notification.getCreatedAt())
                .read(read != null)
                .readAt(read == null ? null : read.getReadAt())
                .build();
    }
}
