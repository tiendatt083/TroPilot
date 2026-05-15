package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class StaffDashboardResponse {

    private long assignedTasks;
    private long overdueTasks;
    private long roomsNeedingUtilityReading;
    private long pendingPaymentConfirmations;
    private long activeMaintenanceRequests;
    private long createdExpenses;
}
