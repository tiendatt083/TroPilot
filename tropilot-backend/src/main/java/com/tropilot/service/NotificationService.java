package com.tropilot.service;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(NotificationCreateRequest request, Long createdById);

    List<NotificationResponse> getResidentNotifications(Long userId);

    List<NotificationResponse> getStaffNotifications(Long userId);

    NotificationResponse markRead(Long userId, Long notificationId);
}
