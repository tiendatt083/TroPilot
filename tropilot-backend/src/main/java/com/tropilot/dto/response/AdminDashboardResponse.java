package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class AdminDashboardResponse {

    private long totalBuildings;
    private long totalRooms;
    private long emptyRooms;
    private long occupiedRooms;
    private long maintenanceRooms;
    private long totalHeadResidents;
    private long totalApprovedRoomMembers;
    private long totalPendingRoomMembers;
    private long totalOccupants;
    private long totalActiveVehicles;
    private long expiringContracts;
    private long unpaidInvoices;
    private long overdueInvoices;
    private BigDecimal totalIncome;
    private BigDecimal unpaidAmount;
    private BigDecimal totalExpense;
    private BigDecimal remainingCash;
    private long pendingMaintenanceRequests;
    private long inProgressTasks;
    private long unresolvedFeedbacks;
}
