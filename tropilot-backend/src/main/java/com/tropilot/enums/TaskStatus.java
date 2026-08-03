package com.tropilot.enums;

/** Vòng đời công việc: mới, đang làm, hoàn tất, bị từ chối hoặc quá hạn. */
public enum TaskStatus {
    NEW,
    IN_PROGRESS,
    COMPLETED,
    REJECTED,
    OVERDUE
}
