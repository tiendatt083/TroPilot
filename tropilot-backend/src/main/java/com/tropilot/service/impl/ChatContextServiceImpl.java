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
import com.tropilot.service.ChatContextService;
import com.tropilot.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChatContextServiceImpl implements ChatContextService {

    private final DashboardService dashboardService;
    private final BuildingRepository buildingRepository;
    private final RoomRepository roomRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public String buildContext(User user) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("generatedAt", LocalDateTime.now());
        context.put("userRole", user.getRole().name());

        switch (user.getRole()) {
            case ADMIN -> addAdminContext(context);
            case STAFF -> addStaffContext(context, user.getId());
            case RESIDENT_HEAD -> addResidentContext(context, user.getId());
        }

        return objectMapper.valueToTree(context).toString();
    }

    private void addAdminContext(Map<String, Object> context) {
        AdminDashboardResponse dashboard = dashboardService.getAdminDashboard();
        Map<String, Object> metrics = new LinkedHashMap<>();

        context.put("dataScope", "GLOBAL_ADMIN");
        metrics.put("totalBuildings", dashboard.getTotalBuildings());
        metrics.put("totalRooms", dashboard.getTotalRooms());
        metrics.put("emptyRooms", dashboard.getEmptyRooms());
        metrics.put("occupiedRooms", dashboard.getOccupiedRooms());
        metrics.put("maintenanceRooms", dashboard.getMaintenanceRooms());
        metrics.put("totalHeadResidents", dashboard.getTotalHeadResidents());
        metrics.put("totalApprovedRoomMembers", dashboard.getTotalApprovedRoomMembers());
        metrics.put("totalPendingRoomMembers", dashboard.getTotalPendingRoomMembers());
        metrics.put("totalOccupants", dashboard.getTotalOccupants());
        metrics.put("totalActiveVehicles", dashboard.getTotalActiveVehicles());
        metrics.put("expiringContracts", dashboard.getExpiringContracts());
        metrics.put("unpaidInvoices", dashboard.getUnpaidInvoices());
        metrics.put("overdueInvoices", dashboard.getOverdueInvoices());
        metrics.put("totalIncome", dashboard.getTotalIncome());
        metrics.put("unpaidAmount", dashboard.getUnpaidAmount());
        metrics.put("totalExpense", dashboard.getTotalExpense());
        metrics.put("remainingCash", dashboard.getRemainingCash());
        metrics.put("pendingMaintenanceRequests", dashboard.getPendingMaintenanceRequests());
        metrics.put("inProgressTasks", dashboard.getInProgressTasks());
        metrics.put("unresolvedFeedbacks", dashboard.getUnresolvedFeedbacks());
        context.put("metrics", metrics);
    }

    private void addStaffContext(Map<String, Object> context, Long staffId) {
        StaffDashboardResponse dashboard = dashboardService.getStaffDashboard(staffId);
        Map<String, Object> metrics = new LinkedHashMap<>();

        context.put("dataScope", "STAFF_OPERATIONAL");
        metrics.put("totalBuildings", buildingRepository.count());
        metrics.put("totalRooms", roomRepository.count());
        metrics.put("emptyRooms", roomRepository.countByStatus(RoomStatus.EMPTY));
        metrics.put("occupiedRooms", roomRepository.countByStatus(RoomStatus.OCCUPIED));
        metrics.put("maintenanceRooms", roomRepository.countByStatus(RoomStatus.MAINTENANCE));
        metrics.put("assignedTasks", dashboard.getAssignedTasks());
        metrics.put("overdueTasks", dashboard.getOverdueTasks());
        metrics.put("roomsNeedingUtilityReading", dashboard.getRoomsNeedingUtilityReading());
        metrics.put("pendingPaymentConfirmations", dashboard.getPendingPaymentConfirmations());
        metrics.put("activeMaintenanceRequests", dashboard.getActiveMaintenanceRequests());
        metrics.put("createdExpenses", dashboard.getCreatedExpenses());
        context.put("metrics", metrics);
    }

    private void addResidentContext(Map<String, Object> context, Long residentHeadId) {
        ResidentDashboardResponse dashboard = dashboardService.getResidentDashboard(residentHeadId);
        HeadResidentAssignmentResponse room = dashboard.getCurrentRoom();
        Map<String, Object> ownRoom = new LinkedHashMap<>();

        context.put("dataScope", "RESIDENT_OWN_ROOM_ONLY");
        ownRoom.put("assigned", room != null && room.isAssigned());

        if (room != null && room.isAssigned()) {
            ownRoom.put("roomCode", room.getRoomCode());
            ownRoom.put("roomName", room.getRoomName());
            ownRoom.put("roomStatus", room.getRoomStatus());
            ownRoom.put("buildingCode", room.getBuildingCode());
            ownRoom.put("buildingName", room.getBuildingName());
            ownRoom.put("approvedMemberCount", dashboard.getApprovedMemberCount());
            ownRoom.put("activeVehicleCount", dashboard.getActiveVehicles().size());
            ownRoom.put("unreadNotificationCount", dashboard.getUnreadNotifications());
            ownRoom.put("recentMaintenanceRequestCount", dashboard.getRecentMaintenanceRequests().size());
            addResidentContract(ownRoom, dashboard.getCurrentContract());
            addResidentInvoice(ownRoom, dashboard.getLatestInvoice());
        }

        context.put("ownRoom", ownRoom);
    }

    private void addResidentContract(Map<String, Object> ownRoom, RentalContractResponse contract) {
        if (contract == null) {
            ownRoom.put("currentContract", null);
            return;
        }

        Map<String, Object> contractData = new LinkedHashMap<>();
        contractData.put("status", contract.getContractStatus());
        contractData.put("rentalStatus", contract.getRentalStatus());
        contractData.put("startDate", contract.getStartDate());
        contractData.put("endDate", contract.getEndDate());
        ownRoom.put("currentContract", contractData);
    }

    private void addResidentInvoice(Map<String, Object> ownRoom, InvoiceResponse invoice) {
        if (invoice == null) {
            ownRoom.put("latestInvoice", null);
            return;
        }

        Map<String, Object> invoiceData = new LinkedHashMap<>();
        invoiceData.put("month", invoice.getMonth());
        invoiceData.put("totalAmount", invoice.getTotalAmount());
        invoiceData.put("dueDate", invoice.getDueDate());
        invoiceData.put("status", invoice.getStatus());
        ownRoom.put("latestInvoice", invoiceData);
    }
}
