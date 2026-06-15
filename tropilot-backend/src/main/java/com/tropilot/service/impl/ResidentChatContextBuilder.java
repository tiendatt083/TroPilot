package com.tropilot.service.impl;

import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.service.ChatRoleContextBuilder;
import com.tropilot.service.DashboardService;
import com.tropilot.service.InvoiceService;
import com.tropilot.service.MaintenanceRequestService;
import com.tropilot.service.NotificationService;
import com.tropilot.service.RoomMemberService;
import com.tropilot.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ResidentChatContextBuilder implements ChatRoleContextBuilder {

    private static final int EXPIRING_CONTRACT_DAYS = 30;
    private static final int RECENT_RECORD_DAYS = 90;
    private static final int MAX_RECENT_RECORDS = 10;

    private final DashboardService dashboardService;
    private final RoomMemberService roomMemberService;
    private final VehicleService vehicleService;
    private final InvoiceService invoiceService;
    private final MaintenanceRequestService maintenanceRequestService;
    private final NotificationService notificationService;

    @Override
    public UserRole getSupportedRole() {
        return UserRole.RESIDENT_HEAD;
    }

    @Override
    public Map<String, Object> build(User user) {
        Long residentHeadId = user.getId();
        LocalDate today = LocalDate.now();
        ResidentDashboardResponse dashboard = dashboardService.getResidentDashboard(residentHeadId);
        HeadResidentAssignmentResponse room = dashboard.getCurrentRoom();
        Map<String, Object> context = new LinkedHashMap<>();
        Map<String, Object> summary = new LinkedHashMap<>();

        if (room == null || !room.isAssigned()) {
            summary.put("currentRoom", Map.of("assigned", false));
            context.put("summary", summary);
            return context;
        }

        List<RoomMemberResponse> activeMembers = roomMemberService.getResidentMembers(residentHeadId)
                .stream()
                .filter(member -> member.getStatus() == RoomMemberStatus.APPROVED)
                .toList();
        List<VehicleResponse> activeVehicles = vehicleService.getResidentVehicles(residentHeadId)
                .stream()
                .filter(vehicle -> vehicle.getStatus() == VehicleStatus.ACTIVE)
                .toList();
        List<InvoiceResponse> invoices = invoiceService.getResidentInvoices(residentHeadId);
        List<MaintenanceRequestResponse> maintenanceRequests = maintenanceRequestService
                .getResidentRequests(residentHeadId);
        List<NotificationResponse> notifications = notificationService.getResidentNotifications(residentHeadId);

        summary.put("currentRoom", buildCurrentRoomSummary(
                room,
                dashboard,
                activeMembers,
                activeVehicles,
                notifications
        ));
        context.put("summary", summary);
        context.put("buildings", List.of(buildOwnBuilding(room)));
        context.put("invoicesNeedingAttention", invoices.stream()
                .filter(invoice -> isRelevantInvoice(invoice, today))
                .limit(MAX_RECENT_RECORDS)
                .map(ChatContextRecordMapper::invoice)
                .toList());
        context.put("expiringContracts", ownExpiringContract(dashboard.getCurrentContract()));
        context.put("maintenanceRequests", maintenanceRequests.stream()
                .filter(request -> isRelevantMaintenance(request, today))
                .limit(MAX_RECENT_RECORDS)
                .map(ChatContextRecordMapper::maintenance)
                .toList());
        return context;
    }

    private Map<String, Object> buildCurrentRoomSummary(
            HeadResidentAssignmentResponse room,
            ResidentDashboardResponse dashboard,
            List<RoomMemberResponse> activeMembers,
            List<VehicleResponse> activeVehicles,
            List<NotificationResponse> notifications
    ) {
        Map<String, Object> currentRoom = new LinkedHashMap<>();
        currentRoom.put("assigned", true);
        currentRoom.put("roomCode", room.getRoomCode());
        currentRoom.put("roomName", room.getRoomName());
        currentRoom.put("roomStatus", room.getRoomStatus());
        currentRoom.put("buildingCode", room.getBuildingCode());
        currentRoom.put("buildingName", room.getBuildingName());
        currentRoom.put("approvedMemberCount", dashboard.getApprovedMemberCount());
        currentRoom.put("activeMembers", activeMembers.stream()
                .map(ChatContextRecordMapper::member)
                .toList());
        currentRoom.put("activeVehicleCount", activeVehicles.size());
        currentRoom.put("activeVehicles", activeVehicles.stream()
                .map(ChatContextRecordMapper::vehicle)
                .toList());
        currentRoom.put("unreadNotificationCount", dashboard.getUnreadNotifications());
        currentRoom.put("recentNotifications", notifications.stream()
                .limit(MAX_RECENT_RECORDS)
                .map(ChatContextRecordMapper::notification)
                .toList());
        currentRoom.put("recentMaintenanceRequestCount", dashboard.getRecentMaintenanceRequests() == null
                ? 0
                : dashboard.getRecentMaintenanceRequests().size());
        currentRoom.put("currentContract", dashboard.getCurrentContract() == null
                ? null
                : ChatContextRecordMapper.contract(dashboard.getCurrentContract()));
        currentRoom.put("latestInvoice", dashboard.getLatestInvoice() == null
                ? null
                : ChatContextRecordMapper.invoice(dashboard.getLatestInvoice()));
        return currentRoom;
    }

    private Map<String, Object> buildOwnBuilding(HeadResidentAssignmentResponse room) {
        Map<String, Object> building = new LinkedHashMap<>();
        building.put("buildingCode", room.getBuildingCode());
        building.put("buildingName", room.getBuildingName());
        building.put("roomCode", room.getRoomCode());
        return building;
    }

    private List<Map<String, Object>> ownExpiringContract(RentalContractResponse contract) {
        if (contract == null || contract.getEndDate() == null) {
            return List.of();
        }

        LocalDate today = LocalDate.now();
        if (contract.getEndDate().isBefore(today)
                || contract.getEndDate().isAfter(today.plusDays(EXPIRING_CONTRACT_DAYS))) {
            return List.of();
        }
        return List.of(ChatContextRecordMapper.contract(contract));
    }

    private boolean isRelevantInvoice(InvoiceResponse invoice, LocalDate today) {
        return invoice.getStatus() != InvoiceStatus.PAID
                || invoice.isHasInvoiceComplaint()
                || isRecent(invoice.getInvoiceDate(), today)
                || isRecent(invoice.getDueDate(), today)
                || isRecent(invoice.getCreatedAt(), today);
    }

    private boolean isRelevantMaintenance(MaintenanceRequestResponse request, LocalDate today) {
        return isUnfinishedMaintenance(request) || isRecent(request.getCreatedAt(), today);
    }

    private boolean isUnfinishedMaintenance(MaintenanceRequestResponse request) {
        return request.getStatus() != MaintenanceStatus.COMPLETED
                && request.getStatus() != MaintenanceStatus.REJECTED;
    }

    private boolean isRecent(LocalDate value, LocalDate today) {
        return value != null && !value.isBefore(today.minusDays(RECENT_RECORD_DAYS));
    }

    private boolean isRecent(LocalDateTime value, LocalDate today) {
        return value != null && isRecent(value.toLocalDate(), today);
    }
}
