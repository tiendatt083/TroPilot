package com.tropilot.service;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.entity.Building;
import com.tropilot.enums.NotificationEventType;

import java.util.List;

/** Hợp đồng tạo, phân phối, đọc và tạo các thông báo tự động của hệ thống. */
public interface NotificationService {

    NotificationResponse createNotification(NotificationCreateRequest request, Long createdById, Long buildingId);

    List<NotificationResponse> getAdminNotifications(Long buildingId);

    List<NotificationResponse> getMyNotifications(Long userId);

    List<NotificationResponse> getResidentNotifications(Long userId);

    List<NotificationResponse> getStaffNotifications(Long userId);

    NotificationResponse markRead(Long userId, Long notificationId);

    void notifyAdmins(
            User actor,
            NotificationEventType eventType,
            String title,
            String content,
            String actionPath,
            Building building
    );

    void notifyUser(
            User actor,
            User recipient,
            NotificationEventType eventType,
            String title,
            String content,
            String actionPath,
            Building building
    );

    void createContractUpdatedNotification(User createdBy, RentalContract contract);

    void createInvoiceIssuedNotification(User createdBy, Invoice invoice, SepayPayment payment);

    void createInvoicePaidNotification(User createdBy, Invoice invoice, SepayPayment payment);
}
