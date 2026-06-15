package com.tropilot.service.impl;

import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.service.BuildingService;
import com.tropilot.service.ChatRoleContextBuilder;
import com.tropilot.service.DashboardService;
import com.tropilot.service.MaintenanceRequestService;
import com.tropilot.service.PaymentService;
import com.tropilot.service.TaskService;
import com.tropilot.service.UtilityReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class StaffChatContextBuilder implements ChatRoleContextBuilder {

    private static final int MAX_DETAIL_RECORDS = 50;
    private static final int RECENT_RECORD_DAYS = 90;

    private final DashboardService dashboardService;
    private final BuildingService buildingService;
    private final UtilityReadingService utilityReadingService;
    private final PaymentService paymentService;
    private final MaintenanceRequestService maintenanceRequestService;
    private final TaskService taskService;

    @Override
    public UserRole getSupportedRole() {
        return UserRole.STAFF;
    }

    @Override
    public Map<String, Object> build(User user) {
        String currentMonth = YearMonth.now().toString();
        LocalDate today = LocalDate.now();
        Long staffId = user.getId();
        List<TaskResponse> activeTasks = taskService.getStaffTasks(staffId)
                .stream()
                .filter(this::isUnfinishedTask)
                .toList();
        List<MaintenanceRequestResponse> relevantMaintenance = maintenanceRequestService
                .getStaffRequests(staffId, null)
                .stream()
                .filter(request -> isRelevantMaintenance(request, today))
                .toList();
        List<MaintenanceRequestResponse> activeMaintenance = relevantMaintenance.stream()
                .filter(this::isUnfinishedMaintenance)
                .toList();
        List<Map<String, Object>> buildings = new ArrayList<>();
        List<Map<String, Object>> roomsNeedingAttention = new ArrayList<>();
        List<Map<String, Object>> pendingPayments = new ArrayList<>();

        for (BuildingResponse building : buildingService.getBuildings(null)) {
            UtilityReadingOverviewResponse overview = utilityReadingService.getOverview(building.getId(), currentMonth);
            List<PaymentResponse> buildingPendingPayments = paymentService.getPendingPayments(building.getId());

            overview.getEligibleRooms().stream()
                    .map(room -> ChatContextRecordMapper.room(room, List.of("MISSING_UTILITY_READING")))
                    .forEach(roomsNeedingAttention::add);
            buildingPendingPayments.stream()
                    .map(ChatContextRecordMapper::payment)
                    .forEach(pendingPayments::add);
            buildings.add(buildBuildingOperationalSummary(
                    building,
                    overview,
                    buildingPendingPayments,
                    activeMaintenance,
                    activeTasks
            ));
        }

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("summary", buildSummary(dashboardService.getStaffDashboard(staffId), currentMonth));
        context.put("buildings", buildings);
        context.put("roomsNeedingAttention", limit(roomsNeedingAttention));
        context.put("invoicesNeedingAttention", limit(pendingPayments));
        context.put("maintenanceRequests", relevantMaintenance.stream()
                .limit(MAX_DETAIL_RECORDS)
                .map(ChatContextRecordMapper::maintenance)
                .toList());
        context.put("tasks", activeTasks.stream()
                .limit(MAX_DETAIL_RECORDS)
                .map(ChatContextRecordMapper::task)
                .toList());
        return context;
    }

    private Map<String, Object> buildSummary(StaffDashboardResponse dashboard, String currentMonth) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("reportingMonth", currentMonth);
        summary.put("assignedTasks", dashboard.getAssignedTasks());
        summary.put("overdueTasks", dashboard.getOverdueTasks());
        summary.put("roomsNeedingUtilityReading", dashboard.getRoomsNeedingUtilityReading());
        summary.put("pendingPaymentConfirmations", dashboard.getPendingPaymentConfirmations());
        summary.put("activeMaintenanceRequests", dashboard.getActiveMaintenanceRequests());
        summary.put("createdExpenses", dashboard.getCreatedExpenses());
        return summary;
    }

    private Map<String, Object> buildBuildingOperationalSummary(
            BuildingResponse building,
            UtilityReadingOverviewResponse overview,
            List<PaymentResponse> pendingPayments,
            List<MaintenanceRequestResponse> activeMaintenance,
            List<TaskResponse> activeTasks
    ) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", building.getBuildingCode());
        data.put("buildingName", building.getName());
        data.put("roomsMissingUtilityReadings", overview.getPendingRooms());
        data.put("pendingPaymentConfirmations", pendingPayments.size());
        data.put("assignedMaintenanceRequests", activeMaintenance.stream()
                .filter(request -> building.getId().equals(request.getBuildingId()))
                .count());
        data.put("assignedTasks", activeTasks.stream()
                .filter(task -> building.getId().equals(task.getBuildingId()))
                .count());
        return data;
    }

    private boolean isUnfinishedMaintenance(MaintenanceRequestResponse request) {
        return request.getStatus() != MaintenanceStatus.COMPLETED
                && request.getStatus() != MaintenanceStatus.REJECTED;
    }

    private boolean isRelevantMaintenance(MaintenanceRequestResponse request, LocalDate today) {
        return isUnfinishedMaintenance(request) || isRecent(request.getCreatedAt(), today);
    }

    private boolean isRecent(LocalDateTime value, LocalDate today) {
        return value != null && !value.toLocalDate().isBefore(today.minusDays(RECENT_RECORD_DAYS));
    }

    private boolean isUnfinishedTask(TaskResponse task) {
        return task.getStatus() != TaskStatus.COMPLETED && task.getStatus() != TaskStatus.REJECTED;
    }

    private List<Map<String, Object>> limit(List<Map<String, Object>> records) {
        return records.stream().limit(MAX_DETAIL_RECORDS).toList();
    }
}
