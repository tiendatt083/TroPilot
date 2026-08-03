package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
/** Các số lượng công việc STAFF cần chú ý: quá hạn, bảo trì, chỉ số và thanh toán chờ. */
public class StaffDashboardResponse {

    private long totalRooms;
    private long assignedTasks;
    private long overdueTasks;
    private long roomsNeedingUtilityReading;
    private long pendingPaymentConfirmations;
    private long activeMaintenanceRequests;
}
