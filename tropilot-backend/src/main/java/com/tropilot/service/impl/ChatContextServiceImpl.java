package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.MaintenanceStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.service.BuildingService;
import com.tropilot.service.CashFlowService;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.DashboardService;
import com.tropilot.service.InvoiceService;
import com.tropilot.service.MaintenanceRequestService;
import com.tropilot.service.NotificationService;
import com.tropilot.service.PaymentService;
import com.tropilot.service.RentalContractService;
import com.tropilot.service.RoomMemberService;
import com.tropilot.service.RoomService;
import com.tropilot.service.TaskService;
import com.tropilot.service.UtilityReadingService;
import com.tropilot.service.VehicleService;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class ChatContextServiceImpl implements ChatContextService {

    private static final String BUSINESS_RULES_PATH = "chat/tropilot-business-rules.json";
    private static final DateTimeFormatter CONTEXT_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final int MAX_DETAIL_RECORDS = 30;
    private static final int RECENT_RECORD_DAYS = 90;
    private static final int EXPIRING_CONTRACT_DAYS = 30;
    private static final Set<String> SENSITIVE_KEY_MARKERS = Set.of(
            "password",
            "token",
            "secret",
            "apikey",
            "authorization",
            "jwt"
    );

    private final ObjectMapper objectMapper;
    private final JsonNode businessRules;
    private final DashboardService dashboardService;
    private final BuildingService buildingService;
    private final RoomService roomService;
    private final InvoiceService invoiceService;
    private final RentalContractService rentalContractService;
    private final UtilityReadingService utilityReadingService;
    private final MaintenanceRequestService maintenanceRequestService;
    private final TaskService taskService;
    private final CashFlowService cashFlowService;
    private final PaymentService paymentService;
    private final RoomMemberService roomMemberService;
    private final VehicleService vehicleService;
    private final NotificationService notificationService;

    public ChatContextServiceImpl(
            ObjectMapper objectMapper,
            DashboardService dashboardService,
            BuildingService buildingService,
            RoomService roomService,
            InvoiceService invoiceService,
            RentalContractService rentalContractService,
            UtilityReadingService utilityReadingService,
            MaintenanceRequestService maintenanceRequestService,
            TaskService taskService,
            CashFlowService cashFlowService,
            PaymentService paymentService,
            RoomMemberService roomMemberService,
            VehicleService vehicleService,
            NotificationService notificationService
    ) {
        this.objectMapper = objectMapper;
        this.businessRules = loadBusinessRules(objectMapper);
        this.dashboardService = dashboardService;
        this.buildingService = buildingService;
        this.roomService = roomService;
        this.invoiceService = invoiceService;
        this.rentalContractService = rentalContractService;
        this.utilityReadingService = utilityReadingService;
        this.maintenanceRequestService = maintenanceRequestService;
        this.taskService = taskService;
        this.cashFlowService = cashFlowService;
        this.paymentService = paymentService;
        this.roomMemberService = roomMemberService;
        this.vehicleService = vehicleService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional(readOnly = true)
    public String buildContext(User user, String message) {
        Set<ChatTopic> topics = classifyTopics(message);
        Map<String, Object> context = createBaseContext(user, topics);
        Map<String, Object> data = data(context);

        switch (user.getRole()) {
            case ADMIN -> addAdminData(data, topics);
            case STAFF -> addStaffData(data, user.getId(), topics);
            case RESIDENT_HEAD -> addResidentData(data, user.getId(), topics);
        }

        return objectMapper.valueToTree(sanitizeValue(context)).toString();
    }

    private Map<String, Object> createBaseContext(User user, Set<ChatTopic> topics) {
        Map<String, Object> context = new LinkedHashMap<>();
        Map<String, Object> userContext = new LinkedHashMap<>();

        userContext.put("role", user.getRole().name());
        userContext.put("dataScope", resolveDataScope(user.getRole()));

        context.put("generatedAt", LocalDateTime.now().format(CONTEXT_TIMESTAMP_FORMAT));
        context.put("user", userContext);
        context.put("matchedTopics", topics.stream().map(Enum::name).toList());
        context.put("businessRules", businessRules.deepCopy());
        context.put("data", new LinkedHashMap<String, Object>());
        return context;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> data(Map<String, Object> context) {
        return (Map<String, Object>) context.get("data");
    }

    private void addAdminData(Map<String, Object> data, Set<ChatTopic> topics) {
        String currentMonth = YearMonth.now().toString();
        LocalDate today = LocalDate.now();
        List<BuildingResponse> buildings = buildingService.getBuildings(null);

        data.put("summary", adminSummary(dashboardService.getAdminDashboard(), currentMonth));

        if (needsBuildings(topics)) {
            data.put("buildings", buildings.stream()
                    .limit(MAX_DETAIL_RECORDS)
                    .map(building -> adminBuildingSummary(building, currentMonth, today))
                    .toList());
        }
        if (topics.contains(ChatTopic.BILLING)) {
            data.put("invoices", limit(buildings.stream()
                    .flatMap(building -> invoiceService.getBuildingInvoices(building.getId()).stream())
                    .filter(invoice -> isRelevantInvoice(invoice, today))
                    .map(this::invoice)));
        }
        if (topics.contains(ChatTopic.UTILITY)) {
            data.put("roomsNeedingUtilityReadings", limit(buildings.stream()
                    .flatMap(building -> utilityReadingService.getOverview(building.getId(), currentMonth)
                            .getEligibleRooms()
                            .stream())
                    .map(room -> room(room, List.of("MISSING_UTILITY_READING")))));
        }
        if (topics.contains(ChatTopic.CONTRACT)) {
            data.put("expiringContracts", limit(buildings.stream()
                    .flatMap(building -> rentalContractService.getContracts(building.getId()).stream())
                    .filter(contract -> expiresSoon(contract, today))
                    .map(this::contract)));
        }
        if (topics.contains(ChatTopic.MAINTENANCE)) {
            data.put("maintenanceRequests", limit(maintenanceRequestService.getRequests(null)
                    .stream()
                    .filter(request -> isRelevantMaintenance(request, today))
                    .map(this::maintenance)));
        }
        if (topics.contains(ChatTopic.TASK)) {
            data.put("tasks", limit(taskService.getTasks(null)
                    .stream()
                    .filter(this::isUnfinishedTask)
                    .map(this::task)));
        }
    }

    private void addStaffData(Map<String, Object> data, Long staffId, Set<ChatTopic> topics) {
        String currentMonth = YearMonth.now().toString();
        LocalDate today = LocalDate.now();
        List<BuildingResponse> buildings = buildingService.getBuildings(null);
        List<MaintenanceRequestResponse> maintenanceRequests = maintenanceRequestService.getStaffRequests(staffId, null);
        List<TaskResponse> tasks = taskService.getStaffTasks(staffId);

        data.put("summary", staffSummary(dashboardService.getStaffDashboard(staffId), currentMonth));

        if (needsBuildings(topics)) {
            data.put("buildings", buildings.stream()
                    .limit(MAX_DETAIL_RECORDS)
                    .map(building -> staffBuildingSummary(
                            building,
                            currentMonth,
                            maintenanceRequests,
                            tasks
                    ))
                    .toList());
        }
        if (topics.contains(ChatTopic.UTILITY)) {
            data.put("roomsNeedingUtilityReadings", limit(buildings.stream()
                    .flatMap(building -> utilityReadingService.getOverview(building.getId(), currentMonth)
                            .getEligibleRooms()
                            .stream())
                    .map(room -> room(room, List.of("MISSING_UTILITY_READING")))));
        }
        if (topics.contains(ChatTopic.BILLING)) {
            data.put("pendingPayments", limit(buildings.stream()
                    .flatMap(building -> paymentService.getPendingPayments(building.getId()).stream())
                    .map(this::payment)));
        }
        if (topics.contains(ChatTopic.MAINTENANCE)) {
            data.put("maintenanceRequests", limit(maintenanceRequests.stream()
                    .filter(request -> isRelevantMaintenance(request, today))
                    .map(this::maintenance)));
        }
        if (topics.contains(ChatTopic.TASK)) {
            data.put("tasks", limit(tasks.stream()
                    .filter(this::isUnfinishedTask)
                    .map(this::task)));
        }
    }

    private void addResidentData(Map<String, Object> data, Long residentHeadId, Set<ChatTopic> topics) {
        LocalDate today = LocalDate.now();
        ResidentDashboardResponse dashboard = dashboardService.getResidentDashboard(residentHeadId);
        HeadResidentAssignmentResponse room = dashboard.getCurrentRoom();

        data.put("summary", residentSummary(dashboard, residentHeadId));

        if (room == null || !room.isAssigned()) {
            return;
        }

        data.put("currentRoom", ownRoom(room));
        if (topics.contains(ChatTopic.RESIDENT_PROFILE)) {
            data.put("activeMembers", roomMemberService.getResidentMembers(residentHeadId)
                    .stream()
                    .filter(member -> member.getStatus() == RoomMemberStatus.APPROVED)
                    .map(this::member)
                    .toList());
            data.put("activeVehicles", vehicleService.getResidentVehicles(residentHeadId)
                    .stream()
                    .filter(vehicle -> vehicle.getStatus() == VehicleStatus.ACTIVE)
                    .map(this::vehicle)
                    .toList());
            data.put("recentNotifications", notificationService.getResidentNotifications(residentHeadId)
                    .stream()
                    .limit(10)
                    .map(this::notification)
                    .toList());
        }
        if (topics.contains(ChatTopic.BILLING)) {
            data.put("invoices", limit(invoiceService.getResidentInvoices(residentHeadId)
                    .stream()
                    .filter(invoice -> isRelevantInvoice(invoice, today))
                    .map(this::invoice)));
        }
        if (topics.contains(ChatTopic.CONTRACT) && dashboard.getCurrentContract() != null) {
            data.put("currentContract", contract(dashboard.getCurrentContract()));
        }
        if (topics.contains(ChatTopic.MAINTENANCE)) {
            data.put("maintenanceRequests", limit(maintenanceRequestService.getResidentRequests(residentHeadId)
                    .stream()
                    .filter(request -> isRelevantMaintenance(request, today))
                    .map(this::maintenance)));
        }
    }

    private Map<String, Object> adminSummary(AdminDashboardResponse dashboard, String currentMonth) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("reportingMonth", currentMonth);
        summary.put("totalBuildings", dashboard.getTotalBuildings());
        summary.put("totalRooms", dashboard.getTotalRooms());
        summary.put("emptyRooms", dashboard.getEmptyRooms());
        summary.put("occupiedRooms", dashboard.getOccupiedRooms());
        summary.put("maintenanceRooms", dashboard.getMaintenanceRooms());
        summary.put("totalHeadResidents", dashboard.getTotalHeadResidents());
        summary.put("totalOccupants", dashboard.getTotalOccupants());
        summary.put("unpaidInvoices", dashboard.getUnpaidInvoices());
        summary.put("overdueInvoices", dashboard.getOverdueInvoices());
        summary.put("unpaidAmount", dashboard.getUnpaidAmount());
        summary.put("totalIncome", dashboard.getTotalIncome());
        summary.put("remainingCash", dashboard.getRemainingCash());
        summary.put("pendingMaintenanceRequests", dashboard.getPendingMaintenanceRequests());
        summary.put("inProgressTasks", dashboard.getInProgressTasks());
        summary.put("unresolvedFeedbacks", dashboard.getUnresolvedFeedbacks());
        return summary;
    }

    private Map<String, Object> staffSummary(StaffDashboardResponse dashboard, String currentMonth) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("reportingMonth", currentMonth);
        summary.put("assignedTasks", dashboard.getAssignedTasks());
        summary.put("overdueTasks", dashboard.getOverdueTasks());
        summary.put("roomsNeedingUtilityReading", dashboard.getRoomsNeedingUtilityReading());
        summary.put("pendingPaymentConfirmations", dashboard.getPendingPaymentConfirmations());
        summary.put("activeMaintenanceRequests", dashboard.getActiveMaintenanceRequests());
        return summary;
    }

    private Map<String, Object> residentSummary(ResidentDashboardResponse dashboard, Long residentHeadId) {
        Map<String, Object> summary = new LinkedHashMap<>();
        HeadResidentAssignmentResponse room = dashboard.getCurrentRoom();

        if (room == null || !room.isAssigned()) {
            summary.put("currentRoom", Map.of("assigned", false));
            return summary;
        }

        List<RoomMemberResponse> activeMembers = roomMemberService.getResidentMembers(residentHeadId)
                .stream()
                .filter(member -> member.getStatus() == RoomMemberStatus.APPROVED)
                .toList();
        List<VehicleResponse> activeVehicles = vehicleService.getResidentVehicles(residentHeadId)
                .stream()
                .filter(vehicle -> vehicle.getStatus() == VehicleStatus.ACTIVE)
                .toList();

        Map<String, Object> currentRoom = ownRoom(room);
        currentRoom.put("approvedMemberCount", dashboard.getApprovedMemberCount());
        currentRoom.put("activeMemberCount", activeMembers.size());
        currentRoom.put("activeVehicleCount", activeVehicles.size());
        currentRoom.put("unreadNotificationCount", dashboard.getUnreadNotifications());
        currentRoom.put("recentMaintenanceRequestCount", dashboard.getRecentMaintenanceRequests() == null
                ? 0
                : dashboard.getRecentMaintenanceRequests().size());
        currentRoom.put("latestInvoice", dashboard.getLatestInvoice() == null
                ? null
                : invoice(dashboard.getLatestInvoice()));
        currentRoom.put("currentContract", dashboard.getCurrentContract() == null
                ? null
                : contract(dashboard.getCurrentContract()));
        summary.put("currentRoom", currentRoom);
        return summary;
    }

    private Map<String, Object> adminBuildingSummary(
            BuildingResponse building,
            String currentMonth,
            LocalDate today
    ) {
        List<RoomResponse> rooms = roomService.getRooms(building.getId(), null, null);
        List<InvoiceResponse> invoices = invoiceService.getBuildingInvoices(building.getId());
        List<RentalContractResponse> contracts = rentalContractService.getContracts(building.getId());
        UtilityReadingOverviewResponse readings = utilityReadingService.getOverview(building.getId(), currentMonth);
        CashFlowResponse cashFlow = cashFlowService.getCashFlow(currentMonth, building.getId());

        Map<String, Object> data = buildingBase(building);
        data.put("totalRooms", rooms.size());
        data.put("occupiedRooms", countRooms(rooms, RoomStatus.OCCUPIED));
        data.put("emptyRooms", countRooms(rooms, RoomStatus.EMPTY));
        data.put("maintenanceRooms", countRooms(rooms, RoomStatus.MAINTENANCE));
        data.put("roomsMissingUtilityReadings", readings.getPendingRooms());
        data.put("activeContracts", contracts.size());
        data.put("expiringContracts", contracts.stream().filter(contract -> expiresSoon(contract, today)).count());
        data.put("unpaidInvoices", invoices.stream().filter(this::requiresInvoiceAttention).count());
        data.put("overdueInvoices", invoices.stream().filter(invoice -> isOverdue(invoice, today)).count());
        data.put("cashFlow", cashFlow(cashFlow));
        return data;
    }

    private Map<String, Object> staffBuildingSummary(
            BuildingResponse building,
            String currentMonth,
            List<MaintenanceRequestResponse> maintenanceRequests,
            List<TaskResponse> tasks
    ) {
        UtilityReadingOverviewResponse readings = utilityReadingService.getOverview(building.getId(), currentMonth);
        List<PaymentResponse> pendingPayments = paymentService.getPendingPayments(building.getId());

        Map<String, Object> data = buildingBase(building);
        data.put("roomsMissingUtilityReadings", readings.getPendingRooms());
        data.put("pendingPaymentConfirmations", pendingPayments.size());
        data.put("assignedMaintenanceRequests", maintenanceRequests.stream()
                .filter(request -> building.getId().equals(request.getBuildingId()))
                .filter(this::isUnfinishedMaintenance)
                .count());
        data.put("assignedTasks", tasks.stream()
                .filter(task -> building.getId().equals(task.getBuildingId()))
                .filter(this::isUnfinishedTask)
                .count());
        return data;
    }

    private Map<String, Object> buildingBase(BuildingResponse building) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", building.getBuildingCode());
        data.put("buildingName", building.getName());
        data.put("address", building.getAddress());
        return data;
    }

    private Map<String, Object> ownRoom(HeadResidentAssignmentResponse room) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("assigned", room.isAssigned());
        data.put("roomCode", room.getRoomCode());
        data.put("roomName", room.getRoomName());
        data.put("roomStatus", room.getRoomStatus());
        data.put("buildingCode", room.getBuildingCode());
        data.put("buildingName", room.getBuildingName());
        return data;
    }

    private Map<String, Object> room(RoomResponse room, List<String> reasons) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("roomCode", room.getRoomCode());
        data.put("roomName", room.getRoomName());
        data.put("buildingCode", room.getBuildingCode());
        data.put("buildingName", room.getBuildingName());
        data.put("status", room.getStatus());
        data.put("reasons", reasons);
        return data;
    }

    private Map<String, Object> invoice(InvoiceResponse invoice) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", invoice.getBuildingCode());
        data.put("roomCode", invoice.getRoomCode());
        data.put("residentHeadName", invoice.getResidentHeadName());
        data.put("invoiceDate", invoice.getInvoiceDate());
        data.put("month", invoice.getMonth());
        data.put("utilityMonth", invoice.getUtilityMonth());
        data.put("dueDate", invoice.getDueDate());
        data.put("totalAmount", invoice.getTotalAmount());
        data.put("status", invoice.getStatus());
        data.put("hasInvoiceComplaint", invoice.isHasInvoiceComplaint());
        data.put("invoiceComplaintStatus", invoice.getInvoiceComplaintStatus());
        if (invoice.getSepayPayment() != null) {
            data.put("sepayPaymentStatus", invoice.getSepayPayment().getStatus());
            data.put("paidAmount", invoice.getSepayPayment().getPaidAmount());
            data.put("paidAt", invoice.getSepayPayment().getPaidAt());
        }
        return data;
    }

    private Map<String, Object> contract(RentalContractResponse contract) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", contract.getBuildingCode());
        data.put("roomCode", contract.getRoomCode());
        data.put("residentHeadName", contract.getResidentHeadName());
        data.put("startDate", contract.getStartDate());
        data.put("endDate", contract.getEndDate());
        data.put("remainingDays", remainingDays(contract.getEndDate()));
        data.put("contractStatus", contract.getContractStatus());
        data.put("rentalStatus", contract.getRentalStatus());
        return data;
    }

    private Map<String, Object> maintenance(MaintenanceRequestResponse request) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", request.getBuildingCode());
        data.put("roomCode", request.getRoomCode());
        data.put("equipmentCode", request.getEquipmentCode());
        data.put("equipmentName", request.getEquipmentName());
        data.put("title", request.getTitle());
        data.put("status", request.getStatus());
        data.put("assignedToName", request.getAssignedToName());
        data.put("createdAt", request.getCreatedAt());
        data.put("updatedAt", request.getUpdatedAt());
        return data;
    }

    private Map<String, Object> task(TaskResponse task) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", task.getBuildingCode());
        data.put("roomCode", task.getRoomCode());
        data.put("title", task.getTitle());
        data.put("taskType", task.getTaskType());
        data.put("deadline", task.getDeadline());
        data.put("priority", task.getPriority());
        data.put("status", task.getStatus());
        data.put("assignedToName", task.getAssignedToName());
        return data;
    }

    private Map<String, Object> payment(PaymentResponse payment) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("buildingCode", payment.getBuildingCode());
        data.put("roomCode", payment.getRoomCode());
        data.put("residentHeadName", payment.getResidentHeadName());
        data.put("invoiceMonth", payment.getInvoiceMonth());
        data.put("invoiceTotalAmount", payment.getInvoiceTotalAmount());
        data.put("invoiceStatus", payment.getInvoiceStatus());
        data.put("paymentStatus", payment.getStatus());
        data.put("uploadedAt", payment.getUploadedAt());
        return data;
    }

    private Map<String, Object> member(RoomMemberResponse member) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("fullName", member.getFullName());
        data.put("relationship", member.getRelationship());
        data.put("moveInDate", member.getMoveInDate());
        data.put("status", member.getStatus());
        return data;
    }

    private Map<String, Object> vehicle(VehicleResponse vehicle) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("ownerName", vehicle.getOwnerName());
        data.put("ownerType", vehicle.getOwnerType());
        data.put("vehicleType", vehicle.getVehicleType());
        data.put("licensePlate", vehicle.getLicensePlate());
        data.put("status", vehicle.getStatus());
        data.put("billable", vehicle.isBillable());
        return data;
    }

    private Map<String, Object> notification(NotificationResponse notification) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("title", notification.getTitle());
        data.put("content", notification.getContent());
        data.put("createdAt", notification.getCreatedAt());
        data.put("read", notification.isRead());
        return data;
    }

    private Map<String, Object> cashFlow(CashFlowResponse cashFlow) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("month", cashFlow.getMonth());
        data.put("totalIncome", cashFlow.getTotalIncome());
        data.put("remainingCash", cashFlow.getRemainingCash());
        data.put("unpaidAmount", cashFlow.getUnpaidAmount());
        return data;
    }

    private boolean needsBuildings(Set<ChatTopic> topics) {
        return topics.contains(ChatTopic.BUILDING)
                || topics.contains(ChatTopic.BILLING)
                || topics.contains(ChatTopic.UTILITY)
                || topics.contains(ChatTopic.MAINTENANCE)
                || topics.contains(ChatTopic.TASK);
    }

    private boolean requiresInvoiceAttention(InvoiceResponse invoice) {
        return invoice.getStatus() != InvoiceStatus.PAID || invoice.isHasInvoiceComplaint();
    }

    private boolean isRelevantInvoice(InvoiceResponse invoice, LocalDate today) {
        return requiresInvoiceAttention(invoice)
                || isRecent(invoice.getInvoiceDate(), today)
                || isRecent(invoice.getDueDate(), today)
                || isRecent(invoice.getCreatedAt(), today);
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

    private boolean isRelevantMaintenance(MaintenanceRequestResponse request, LocalDate today) {
        return isUnfinishedMaintenance(request) || isRecent(request.getCreatedAt(), today);
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

    private Long remainingDays(LocalDate endDate) {
        return endDate == null ? null : ChronoUnit.DAYS.between(LocalDate.now(), endDate);
    }

    private boolean isRecent(LocalDateTime value, LocalDate today) {
        return value != null && isRecent(value.toLocalDate(), today);
    }

    private boolean isRecent(LocalDate value, LocalDate today) {
        return value != null && !value.isBefore(today.minusDays(RECENT_RECORD_DAYS));
    }

    private List<Map<String, Object>> limit(java.util.stream.Stream<Map<String, Object>> records) {
        return records.limit(MAX_DETAIL_RECORDS).toList();
    }

    private Set<ChatTopic> classifyTopics(String message) {
        String text = normalize(message);
        Set<ChatTopic> topics = EnumSet.noneOf(ChatTopic.class);

        if (containsAny(text, "toa nha", "building", "phong", "room", "tong quan", "dashboard")) {
            topics.add(ChatTopic.BUILDING);
        }
        if (containsAny(text, "hoa don", "thanh toan", "bien lai", "invoice", "payment", "receipt", "sepay")) {
            topics.add(ChatTopic.BILLING);
        }
        if (containsAny(text, "dien", "nuoc", "chi so", "utility", "reading", "meter")) {
            topics.add(ChatTopic.UTILITY);
        }
        if (containsAny(text, "hop dong", "contract")) {
            topics.add(ChatTopic.CONTRACT);
        }
        if (containsAny(text, "bao tri", "sua chua", "thiet bi", "maintenance", "equipment")) {
            topics.add(ChatTopic.MAINTENANCE);
        }
        if (containsAny(text, "cong viec", "nhiem vu", "task")) {
            topics.add(ChatTopic.TASK);
        }
        if (containsAny(text, "thanh vien", "cu dan", "xe", "thong bao", "member", "vehicle", "notification")) {
            topics.add(ChatTopic.RESIDENT_PROFILE);
        }
        if (topics.isEmpty()) {
            topics.add(ChatTopic.BUILDING);
        }
        return topics;
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String lowercase = value.toLowerCase(Locale.ROOT).replace('đ', 'd');
        return Normalizer.normalize(lowercase, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String resolveDataScope(UserRole role) {
        return switch (role) {
            case ADMIN -> "GLOBAL_ADMIN";
            case STAFF -> "STAFF_OPERATIONAL";
            case RESIDENT_HEAD -> "RESIDENT_OWN_ROOM_ONLY";
        };
    }

    private Object sanitizeValue(Object value) {
        if (value instanceof Map<?, ?> mapValue) {
            Map<String, Object> sanitized = new LinkedHashMap<>();
            mapValue.forEach((key, nestedValue) -> {
                String field = String.valueOf(key);
                if (!isSensitiveKey(field)) {
                    sanitized.put(field, sanitizeValue(nestedValue));
                }
            });
            return sanitized;
        }
        if (value instanceof List<?> listValue) {
            return listValue.stream()
                    .map(this::sanitizeValue)
                    .toList();
        }
        return value;
    }

    private boolean isSensitiveKey(String key) {
        String normalizedKey = key.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        return SENSITIVE_KEY_MARKERS.stream().anyMatch(normalizedKey::contains);
    }

    private JsonNode loadBusinessRules(ObjectMapper mapper) {
        ClassPathResource resource = new ClassPathResource(BUSINESS_RULES_PATH);

        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode loadedRules = mapper.readTree(inputStream);

            if (loadedRules == null || !loadedRules.isObject()) {
                throw new IllegalStateException("Chat business rules must be a JSON object");
            }

            return loadedRules;
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Could not load chat business rules from " + BUSINESS_RULES_PATH,
                    exception
            );
        }
    }

    private enum ChatTopic {
        BUILDING,
        BILLING,
        UTILITY,
        CONTRACT,
        MAINTENANCE,
        TASK,
        RESIDENT_PROFILE
    }
}
