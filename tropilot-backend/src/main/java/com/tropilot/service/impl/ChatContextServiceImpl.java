package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomStatus;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ChatBusinessRuleProvider;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatContextServiceImpl implements ChatContextService {

    private static final DateTimeFormatter CONTEXT_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String GLOBAL_ADMIN_SCOPE = "GLOBAL_ADMIN";
    private static final String STAFF_OPERATIONAL_SCOPE = "STAFF_OPERATIONAL";
    private static final String RESIDENT_OWN_ROOM_SCOPE = "RESIDENT_OWN_ROOM_ONLY";

    private final DashboardService dashboardService;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final ChatBusinessRuleProvider chatBusinessRuleProvider;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public String buildContext(User user) {
        Map<String, Object> context = createBaseContext(user);
        Map<String, Object> summary = getSummary(context);

        switch (user.getRole()) {
            case ADMIN -> addAdminSummary(summary);
            case STAFF -> addStaffSummary(summary, user.getId());
            case RESIDENT_HEAD -> addResidentSummary(summary, user.getId());
        }

        return objectMapper.valueToTree(context).toString();
    }

    private Map<String, Object> createBaseContext(User user) {
        Map<String, Object> context = new LinkedHashMap<>();
        Map<String, Object> userContext = new LinkedHashMap<>();

        userContext.put("role", user.getRole().name());
        userContext.put("dataScope", resolveDataScope(user));

        context.put("generatedAt", LocalDateTime.now().format(CONTEXT_TIMESTAMP_FORMAT));
        context.put("user", userContext);
        context.put("businessRules", chatBusinessRuleProvider.getBusinessRules());
        context.put("summary", new LinkedHashMap<>());
        context.put("buildings", List.of());
        context.put("roomsNeedingAttention", List.of());
        context.put("invoicesNeedingAttention", List.of());
        context.put("expiringContracts", List.of());
        context.put("maintenanceRequests", List.of());
        context.put("tasks", List.of());
        return context;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getSummary(Map<String, Object> context) {
        return (Map<String, Object>) context.get("summary");
    }

    private String resolveDataScope(User user) {
        return switch (user.getRole()) {
            case ADMIN -> GLOBAL_ADMIN_SCOPE;
            case STAFF -> STAFF_OPERATIONAL_SCOPE;
            case RESIDENT_HEAD -> RESIDENT_OWN_ROOM_SCOPE;
        };
    }

    private void addAdminSummary(Map<String, Object> summary) {
        AdminDashboardResponse dashboard = dashboardService.getAdminDashboard();

        summary.put("totalBuildings", dashboard.getTotalBuildings());
        summary.put("totalRooms", dashboard.getTotalRooms());
        summary.put("emptyRooms", dashboard.getEmptyRooms());
        summary.put("occupiedRooms", dashboard.getOccupiedRooms());
        summary.put("maintenanceRooms", dashboard.getMaintenanceRooms());
        summary.put("totalHeadResidents", dashboard.getTotalHeadResidents());
        summary.put("totalApprovedRoomMembers", dashboard.getTotalApprovedRoomMembers());
        summary.put("totalPendingRoomMembers", dashboard.getTotalPendingRoomMembers());
        summary.put("totalOccupants", dashboard.getTotalOccupants());
        summary.put("totalActiveVehicles", dashboard.getTotalActiveVehicles());
        summary.put("expiringContracts", dashboard.getExpiringContracts());
        summary.put("unpaidInvoices", dashboard.getUnpaidInvoices());
        summary.put("overdueInvoices", dashboard.getOverdueInvoices());
        summary.put("totalIncome", dashboard.getTotalIncome());
        summary.put("unpaidAmount", dashboard.getUnpaidAmount());
        summary.put("totalExpense", dashboard.getTotalExpense());
        summary.put("remainingCash", dashboard.getRemainingCash());
        summary.put("pendingMaintenanceRequests", dashboard.getPendingMaintenanceRequests());
        summary.put("inProgressTasks", dashboard.getInProgressTasks());
        summary.put("unresolvedFeedbacks", dashboard.getUnresolvedFeedbacks());
    }

    private void addStaffSummary(Map<String, Object> summary, Long staffId) {
        StaffDashboardResponse dashboard = dashboardService.getStaffDashboard(staffId);

        summary.put("totalBuildings", buildingRepository.count());
        summary.put("totalRooms", roomRepository.count());
        summary.put("emptyRooms", roomRepository.countByStatus(RoomStatus.EMPTY));
        summary.put("occupiedRooms", roomRepository.countByStatus(RoomStatus.OCCUPIED));
        summary.put("maintenanceRooms", roomRepository.countByStatus(RoomStatus.MAINTENANCE));
        summary.put("assignedTasks", dashboard.getAssignedTasks());
        summary.put("overdueTasks", dashboard.getOverdueTasks());
        summary.put("roomsNeedingUtilityReading", dashboard.getRoomsNeedingUtilityReading());
        summary.put("pendingPaymentConfirmations", dashboard.getPendingPaymentConfirmations());
        summary.put("activeMaintenanceRequests", dashboard.getActiveMaintenanceRequests());
        summary.put("createdExpenses", dashboard.getCreatedExpenses());
    }

    private void addResidentSummary(Map<String, Object> summary, Long residentHeadId) {
        ResidentDashboardResponse dashboard = dashboardService.getResidentDashboard(residentHeadId);
        HeadResidentAssignmentResponse room = dashboard.getCurrentRoom();
        Map<String, Object> currentRoom = new LinkedHashMap<>();

        currentRoom.put("assigned", room != null && room.isAssigned());

        if (room != null && room.isAssigned()) {
            currentRoom.put("roomCode", room.getRoomCode());
            currentRoom.put("roomName", room.getRoomName());
            currentRoom.put("roomStatus", room.getRoomStatus());
            currentRoom.put("buildingCode", room.getBuildingCode());
            currentRoom.put("buildingName", room.getBuildingName());
            currentRoom.put("approvedMemberCount", dashboard.getApprovedMemberCount());
            currentRoom.put("activeVehicleCount", sizeOf(dashboard.getActiveVehicles()));
            currentRoom.put("unreadNotificationCount", dashboard.getUnreadNotifications());
            currentRoom.put("recentMaintenanceRequestCount", sizeOf(dashboard.getRecentMaintenanceRequests()));
            addResidentContract(currentRoom, dashboard.getCurrentContract());
            addResidentInvoice(currentRoom, dashboard.getLatestInvoice());
        }

        summary.put("currentRoom", currentRoom);
    }

    private int sizeOf(Collection<?> values) {
        return values == null ? 0 : values.size();
    }

    private void addResidentContract(Map<String, Object> currentRoom, RentalContractResponse contract) {
        if (contract == null) {
            currentRoom.put("currentContract", null);
            return;
        }

        Map<String, Object> contractData = new LinkedHashMap<>();
        contractData.put("status", contract.getContractStatus());
        contractData.put("rentalStatus", contract.getRentalStatus());
        contractData.put("startDate", contract.getStartDate());
        contractData.put("endDate", contract.getEndDate());
        currentRoom.put("currentContract", contractData);
    }

    private void addResidentInvoice(Map<String, Object> currentRoom, InvoiceResponse invoice) {
        if (invoice == null) {
            currentRoom.put("latestInvoice", null);
            return;
        }

        Map<String, Object> invoiceData = new LinkedHashMap<>();
        invoiceData.put("month", invoice.getMonth());
        invoiceData.put("totalAmount", invoice.getTotalAmount());
        invoiceData.put("dueDate", invoice.getDueDate());
        invoiceData.put("status", invoice.getStatus());
        currentRoom.put("latestInvoice", invoiceData);
    }
}
