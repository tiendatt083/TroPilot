package com.tropilot.service;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.User;

import java.util.List;

public interface NotificationService {

    NotificationResponse createNotification(NotificationCreateRequest request, Long createdById, Long buildingId);

    List<NotificationResponse> getAdminNotifications(Long buildingId);

    List<NotificationResponse> getResidentNotifications(Long userId);

    List<NotificationResponse> getStaffNotifications(Long userId);

    NotificationResponse markRead(Long userId, Long notificationId);

    void createContractUpdatedNotification(User createdBy, RentalContract contract);
}
