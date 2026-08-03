package com.tropilot.enums;

/** Cách chọn người nhận: toàn bộ, theo vai trò, tòa nhà, phòng hoặc cá nhân. */
public enum NotificationTargetType {
    ALL_RESIDENT_HEADS,
    ONE_BUILDING,
    ONE_ROOM,
    ONE_USER,
    SELECTED_USERS,
    STAFF,
    ALL
}
