package com.tropilot.enums;

/** Sự kiện nghiệp vụ tạo thông báo; MANUAL là thông báo do người dùng tự gửi. */
public enum NotificationEventType {
    MANUAL,
    FEEDBACK_CREATED,
    FEEDBACK_UPDATED,
    TASK_ASSIGNED,
    TASK_COMPLETED,
    TASK_REJECTED,
    PAYMENT_SUBMITTED,
    PAYMENT_RECEIVED,
    PAYMENT_REJECTED,
    INVOICE_ISSUED,
    CONTRACT_UPDATED,
    MEMBER_REQUESTED,
    MEMBER_APPROVED,
    MEMBER_REJECTED,
    VEHICLE_REJECTED
}
