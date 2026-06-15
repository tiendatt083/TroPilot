package com.tropilot.service.impl;

import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.service.BuildingService;
import com.tropilot.service.CashFlowService;
import com.tropilot.service.ChatRoleContextBuilder;
import com.tropilot.service.DashboardService;
import com.tropilot.service.InvoiceService;
import com.tropilot.service.MaintenanceRequestService;
import com.tropilot.service.RentalContractService;
import com.tropilot.service.RoomService;
import com.tropilot.service.TaskService;
import com.tropilot.service.UtilityReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AdminChatContextBuilder implements ChatRoleContextBuilder {

    private static final int EXPIRING_CONTRACT_DAYS = 30;
    private static final int MAX_DETAIL_RECORDS = 50;

    private final DashboardService dashboardService;
    private final BuildingService buildingService;
    private final RoomService roomService;
    private final InvoiceService invoiceService;
    private final RentalContractService rentalContractService;
    private final UtilityReadingService utilityReadingService;
    private final MaintenanceRequestService maintenanceRequestService;
    private final TaskService taskService;
    private final CashFlowService cashFlowService;

    @Override
    public UserRole getSupportedRole() {
        return UserRole.ADMIN;
    }

    @Override
    public Map<String, Object> build(User user) {
        String currentMonth = YearMonth.now().toString();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> buildings = new ArrayList<>();
        Map<Long, RoomAttention> roomsNeedingAttention = new LinkedHashMap<>();
        List<Map<String, Object>> invoicesNeedingAttention = new ArrayList<>();
        List<Map<String, Object>> expiringContracts = new ArrayList<>();
        List<MaintenanceRequestResponse> unfinishedMaintenance = maintenanceRequestService.getRequests(null)
                .stream()
                .filter(this::isUnfinishedMaintenance)
                .toList();
        List<TaskResponse> unfinishedTasks = taskService.getTasks(null)
                .stream()
                .filter(this::isUnfinishedTask)
                .toList();

        for (BuildingResponse building : buildingService.getBuildings(null)) {
            addBuildingContext(
                    building,
                    currentMonth,
                    today,
                    buildings,
                    roomsNeedingAttention,
                    invoicesNeedingAttention,
                    expiringContracts,
                    unfinishedMaintenance,
                    unfinishedTasks
            );
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("summary", buildSummary(dashboardService.getAdminDashboard(), currentMonth));
        context.put("buildings", buildings);
        context.put("roomsNeedingAttention", limitRooms(roomsNeedingAttention));
        context.put("invoicesNeedingAttention", limit(invoicesNeedingAttention));
        context.put("expiringContracts", limit(expiringContracts));
        context.put("maintenanceRequests", unfinishedMaintenance.stream()
                .limit(MAX_DETAIL_RECORDS)
                .map(ChatContextRecordMapper::maintenance)
                .toList());
        context.put("tasks", unfinishedTasks.stream()
                .limit(MAX_DETAIL_RECORDS)
                .map(ChatContextRecordMapper::task)
                .toList());
        return context;
    }

    private void addBuildingContext(
            BuildingResponse building,
            String currentMonth,
            LocalDate today,
            List<Map<String, Object>> buildings,
            Map<Long, RoomAttention> roomsNeedingAttention,
            List<Map<String, Object>> invoicesNeedingAttention,
            List<Map<String, Object>> expiringContracts,
            List<MaintenanceRequestResponse> unfinishedMaintenance,
            List<TaskResponse> unfinishedTasks
    ) {
        Long buildingId = building.getId();
        List<RoomResponse> rooms = roomService.getRooms(buildingId, null, null);
        List<InvoiceResponse> invoices = invoiceService.getBuildingInvoices(buildingId);
        List<RentalContractResponse> contracts = rentalContractService.getContracts(buildingId);
        UtilityReadingOverviewResponse readingOverview = utilityReadingService.getOverview(buildingId, currentMonth);
        List<MaintenanceRequestResponse> buildingMaintenance = unfinishedMaintenance.stream()
                .filter(request -> buildingId.equals(request.getBuildingId()))
                .toList();
        List<TaskResponse> buildingTasks = unfinishedTasks.stream()
                .filter(task -> buildingId.equals(task.getBuildingId()))
                .toList();
        CashFlowResponse cashFlow = cashFlowService.getCashFlow(currentMonth, buildingId);

        buildings.add(buildBuildingSummary(
                building,
                rooms,
                invoices,
                contracts,
                readingOverview,
                buildingMaintenance,
                buildingTasks,
                cashFlow,
                today
        ));
        addMissingReadingRooms(readingOverview, roomsNeedingAttention);
        addMissingInvoiceRooms(rooms, invoices, roomsNeedingAttention, currentMonth);
        invoices.stream()
                .filter(this::requiresInvoiceAttention)
                .map(ChatContextRecordMapper::invoice)
                .forEach(invoicesNeedingAttention::add);
        contracts.stream()
                .filter(contract -> expiresSoon(contract, today))
                .map(ChatContextRecordMapper::contract)
                .forEach(expiringContracts::add);
    }

    private Map<String, Object> buildSummary(AdminDashboardResponse dashboard, String currentMonth) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("reportingMonth", currentMonth);
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
        return summary;
    }

    private Map<String, Object> buildBuildingSummary(
            BuildingResponse building,
            List<RoomResponse> rooms,
            List<InvoiceResponse> invoices,
            List<RentalContractResponse> contracts,
            UtilityReadingOverviewResponse readingOverview,
            List<MaintenanceRequestResponse> maintenanceRequests,
            List<TaskResponse> tasks,
            CashFlowResponse cashFlow,
            LocalDate today
    ) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingId", building.getId());
        data.put("buildingCode", building.getBuildingCode());
        data.put("buildingName", building.getName());
        data.put("address", building.getAddress());
        data.put("totalRooms", rooms.size());
        data.put("occupiedRooms", countRooms(rooms, RoomStatus.OCCUPIED));
        data.put("emptyRooms", countRooms(rooms, RoomStatus.EMPTY));
        data.put("maintenanceRooms", countRooms(rooms, RoomStatus.MAINTENANCE));
        data.put("roomsMissingUtilityReadings", readingOverview.getPendingRooms());
        data.put("activeContracts", contracts.size());
        data.put("unpaidInvoices", invoices.stream().filter(this::requiresInvoiceAttention).count());
        data.put("overdueInvoices", invoices.stream().filter(invoice -> isOverdue(invoice, today)).count());
        data.put("pendingMaintenanceRequests", maintenanceRequests.stream().filter(this::isUnfinishedMaintenance).count());
        data.put("activeTasks", tasks.stream().filter(this::isUnfinishedTask).count());
        data.put("cashFlow", ChatContextRecordMapper.cashFlow(cashFlow));
        return data;
    }

    private void addMissingReadingRooms(
            UtilityReadingOverviewResponse overview,
            Map<Long, RoomAttention> attentionByRoom
    ) {
        overview.getEligibleRooms().forEach(room -> addRoomReason(
                attentionByRoom,
                room,
                "MISSING_UTILITY_READING"
        ));
    }

    private void addMissingInvoiceRooms(
            List<RoomResponse> rooms,
            List<InvoiceResponse> invoices,
            Map<Long, RoomAttention> attentionByRoom,
            String currentMonth
    ) {
        Set<Long> invoicedRoomIds = invoices.stream()
                .filter(invoice -> currentMonth.equals(invoice.getMonth()))
                .map(InvoiceResponse::getRoomId)
                .collect(Collectors.toSet());

        rooms.stream()
                .filter(room -> room.getStatus() == RoomStatus.OCCUPIED)
                .filter(room -> !invoicedRoomIds.contains(room.getId()))
                .forEach(room -> addRoomReason(attentionByRoom, room, "MISSING_CURRENT_INVOICE"));
    }

    private void addRoomReason(Map<Long, RoomAttention> attentionByRoom, RoomResponse room, String reason) {
        attentionByRoom
                .computeIfAbsent(room.getId(), ignored -> new RoomAttention(room))
                .reasons()
                .add(reason);
    }

    private boolean requiresInvoiceAttention(InvoiceResponse invoice) {
        return invoice.getStatus() != InvoiceStatus.PAID || invoice.isHasInvoiceComplaint();
    }

    private boolean isOverdue(InvoiceResponse invoice, LocalDate today) {
        return invoice.getStatus() == InvoiceStatus.OVERDUE
                || (invoice.getStatus() != InvoiceStatus.PAID
                && invoice.getDueDate() != null
                && invoice.getDueDate().isBefore(today));
    }

    private boolean expiresSoon(RentalContractResponse contract, LocalDate today) {
        return contract.getEndDate() != null
                && !contract.getEndDate().isBefore(today)
                && !contract.getEndDate().isAfter(today.plusDays(EXPIRING_CONTRACT_DAYS));
    }

    private boolean isUnfinishedMaintenance(MaintenanceRequestResponse request) {
        return request.getStatus() != MaintenanceStatus.COMPLETED
                && request.getStatus() != MaintenanceStatus.REJECTED;
    }

    private boolean isUnfinishedTask(TaskResponse task) {
        return task.getStatus() != TaskStatus.COMPLETED && task.getStatus() != TaskStatus.REJECTED;
    }

    private long countRooms(List<RoomResponse> rooms, RoomStatus status) {
        return rooms.stream().filter(room -> room.getStatus() == status).count();
    }

    private List<Map<String, Object>> limitRooms(Map<Long, RoomAttention> attentionByRoom) {
        return attentionByRoom.values().stream()
                .limit(MAX_DETAIL_RECORDS)
                .map(attention -> ChatContextRecordMapper.room(
                        attention.room(),
                        List.copyOf(attention.reasons())
                ))
                .toList();
    }

    private List<Map<String, Object>> limit(List<Map<String, Object>> records) {
        return records.stream().limit(MAX_DETAIL_RECORDS).toList();
    }

    private record RoomAttention(RoomResponse room, Set<String> reasons) {
        private RoomAttention(RoomResponse room) {
            this(room, new LinkedHashSet<>());
        }
    }
}
