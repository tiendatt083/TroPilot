package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
/** Dữ liệu dashboard trưởng phòng: phòng, hợp đồng, hóa đơn mới nhất, xe, thông báo và bảo trì. */
public class ResidentDashboardResponse {

    private HeadResidentAssignmentResponse currentRoom;
    private long approvedMemberCount;
    private RentalContractResponse currentContract;
    private InvoiceResponse latestInvoice;
    private LocalDate paymentDueDate;
    private List<VehicleResponse> activeVehicles;
    private long unreadNotifications;
    private List<MaintenanceRequestResponse> recentMaintenanceRequests;
}
