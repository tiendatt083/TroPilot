package com.tropilot.service.impl;

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
import com.tropilot.enums.PaymentStatus;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomMemberStatus;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.VehicleStatus;
import com.tropilot.service.BuildingService;
import com.tropilot.service.CashFlowService;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RoleChatContextBuilderTest {

    @Mock
    private DashboardService dashboardService;
    @Mock
    private BuildingService buildingService;
    @Mock
    private RoomService roomService;
    @Mock
    private InvoiceService invoiceService;
    @Mock
    private RentalContractService rentalContractService;
    @Mock
    private UtilityReadingService utilityReadingService;
    @Mock
    private MaintenanceRequestService maintenanceRequestService;
    @Mock
    private TaskService taskService;
    @Mock
    private CashFlowService cashFlowService;
    @Mock
    private PaymentService paymentService;
    @Mock
    private RoomMemberService roomMemberService;
    @Mock
    private VehicleService vehicleService;
    @Mock
    private NotificationService notificationService;

    @Test
    void adminBuilderAddsBuildingStatisticsAndGlobalAttentionLists() {
        String month = YearMonth.now().toString();
        BuildingResponse building = building();
        RoomResponse room = room();
        InvoiceResponse invoice = invoice(InvoiceStatus.UNPAID);
        RentalContractResponse contract = RentalContractResponse.builder()
                .id(41L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .residentHeadName("Resident")
                .rentalStatus(RentalStatus.ACTIVE)
                .endDate(LocalDate.now().plusDays(10))
                .build();
        MaintenanceRequestResponse maintenance = maintenance();
        TaskResponse task = task();

        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .totalBuildings(1)
                .totalRooms(1)
                .occupiedRooms(1)
                .unpaidInvoices(1)
                .build());
        when(buildingService.getBuildings(null)).thenReturn(List.of(building));
        when(roomService.getRooms(1L, null, null)).thenReturn(List.of(room));
        when(invoiceService.getBuildingInvoices(1L)).thenReturn(List.of(invoice));
        when(rentalContractService.getContracts(1L)).thenReturn(List.of(contract));
        when(utilityReadingService.getOverview(1L, month)).thenReturn(UtilityReadingOverviewResponse.builder()
                .month(month)
                .totalRooms(1)
                .pendingRooms(1)
                .eligibleRooms(List.of(room))
                .build());
        when(maintenanceRequestService.getRequests(null)).thenReturn(List.of(maintenance));
        when(taskService.getTasks(null)).thenReturn(List.of(task));
        when(cashFlowService.getCashFlow(month, 1L)).thenReturn(cashFlow());

        Map<String, Object> context = new AdminChatContextBuilder(
                dashboardService,
                buildingService,
                roomService,
                invoiceService,
                rentalContractService,
                utilityReadingService,
                maintenanceRequestService,
                taskService,
                cashFlowService
        ).build(user(1L, UserRole.ADMIN));

        assertThat(list(context, "buildings")).hasSize(1);
        assertThat(list(context, "roomsNeedingAttention")).hasSize(1);
        assertThat(list(context, "invoicesNeedingAttention")).hasSize(1);
        assertThat(list(context, "expiringContracts")).hasSize(1);
        assertThat(list(context, "maintenanceRequests")).hasSize(1);
        assertThat(list(context, "tasks")).hasSize(1);
        assertThat(map(list(context, "buildings").get(0)).get("cashFlow")).isNotNull();
        assertThat(map(list(context, "roomsNeedingAttention").get(0))).doesNotContainKeys("roomId", "buildingId");
        assertThat(map(list(context, "invoicesNeedingAttention").get(0))).doesNotContainKey("invoiceId");
        assertThat(map(list(context, "maintenanceRequests").get(0))).doesNotContainKey("requestId");
        assertThat(map(list(context, "tasks").get(0))).doesNotContainKey("taskId");
    }

    @Test
    void adminBuilderLimitsAttentionListsAndSkipsOldCompletedMaintenance() {
        String month = YearMonth.now().toString();
        BuildingResponse building = building();
        RoomResponse room = room();
        List<InvoiceResponse> invoices = IntStream.range(0, 55)
                .mapToObj(index -> InvoiceResponse.builder()
                        .id((long) index)
                        .buildingCode("BD01")
                        .roomCode("BD01-P101")
                        .residentHeadName("Resident")
                        .month(month)
                        .invoiceDate(LocalDate.now())
                        .totalAmount(BigDecimal.valueOf(1000 + index))
                        .status(InvoiceStatus.UNPAID)
                        .build())
                .toList();
        MaintenanceRequestResponse oldCompletedMaintenance = maintenance(
                "Old completed request",
                MaintenanceStatus.COMPLETED,
                LocalDateTime.now().minusDays(120)
        );
        MaintenanceRequestResponse recentCompletedMaintenance = maintenance(
                "Recent completed request",
                MaintenanceStatus.COMPLETED,
                LocalDateTime.now().minusDays(5)
        );

        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .totalBuildings(1)
                .totalRooms(1)
                .occupiedRooms(1)
                .unpaidInvoices(55)
                .build());
        when(buildingService.getBuildings(null)).thenReturn(List.of(building));
        when(roomService.getRooms(1L, null, null)).thenReturn(List.of(room));
        when(invoiceService.getBuildingInvoices(1L)).thenReturn(invoices);
        when(rentalContractService.getContracts(1L)).thenReturn(List.of());
        when(utilityReadingService.getOverview(1L, month)).thenReturn(UtilityReadingOverviewResponse.builder()
                .month(month)
                .totalRooms(1)
                .pendingRooms(0)
                .eligibleRooms(List.of())
                .build());
        when(maintenanceRequestService.getRequests(null)).thenReturn(List.of(
                oldCompletedMaintenance,
                recentCompletedMaintenance
        ));
        when(taskService.getTasks(null)).thenReturn(List.of());
        when(cashFlowService.getCashFlow(month, 1L)).thenReturn(cashFlow());

        Map<String, Object> context = new AdminChatContextBuilder(
                dashboardService,
                buildingService,
                roomService,
                invoiceService,
                rentalContractService,
                utilityReadingService,
                maintenanceRequestService,
                taskService,
                cashFlowService
        ).build(user(1L, UserRole.ADMIN));

        assertThat(list(context, "invoicesNeedingAttention")).hasSize(50);
        assertThat(list(context, "maintenanceRequests")).hasSize(1);
        assertThat(map(list(context, "maintenanceRequests").get(0)).get("title"))
                .isEqualTo("Recent completed request");
    }

    @Test
    void staffBuilderContainsOnlyAuthorizedOperationalData() {
        String month = YearMonth.now().toString();
        User staff = user(2L, UserRole.STAFF);
        BuildingResponse building = building();
        RoomResponse room = room();
        MaintenanceRequestResponse maintenance = maintenance();
        TaskResponse task = task();

        when(dashboardService.getStaffDashboard(2L)).thenReturn(StaffDashboardResponse.builder()
                .assignedTasks(1)
                .roomsNeedingUtilityReading(1)
                .pendingPaymentConfirmations(1)
                .activeMaintenanceRequests(1)
                .build());
        when(buildingService.getBuildings(null)).thenReturn(List.of(building));
        when(utilityReadingService.getOverview(1L, month)).thenReturn(UtilityReadingOverviewResponse.builder()
                .month(month)
                .pendingRooms(1)
                .eligibleRooms(List.of(room))
                .build());
        when(paymentService.getPendingPayments(1L)).thenReturn(List.of(PaymentResponse.builder()
                .id(51L)
                .invoiceId(31L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .status(PaymentStatus.PENDING)
                .build()));
        when(maintenanceRequestService.getStaffRequests(2L, null)).thenReturn(List.of(maintenance));
        when(taskService.getStaffTasks(2L)).thenReturn(List.of(task));

        Map<String, Object> context = new StaffChatContextBuilder(
                dashboardService,
                buildingService,
                utilityReadingService,
                paymentService,
                maintenanceRequestService,
                taskService
        ).build(staff);

        assertThat(list(context, "roomsNeedingAttention")).hasSize(1);
        assertThat(list(context, "invoicesNeedingAttention")).hasSize(1);
        assertThat(list(context, "maintenanceRequests")).hasSize(1);
        assertThat(list(context, "tasks")).hasSize(1);
        assertThat(context).doesNotContainKeys("expiringContracts");
        assertThat(map(context.get("summary"))).doesNotContainKeys("totalIncome", "totalExpense", "remainingCash");
        assertThat(map(list(context, "buildings").get(0))).doesNotContainKey("cashFlow");
    }

    @Test
    void residentBuilderContainsOnlyCurrentRoomData() {
        User resident = user(3L, UserRole.RESIDENT_HEAD);
        HeadResidentAssignmentResponse assignment = HeadResidentAssignmentResponse.builder()
                .assigned(true)
                .roomId(11L)
                .roomCode("BD01-P101")
                .roomName("Room 101")
                .roomStatus(RoomStatus.OCCUPIED)
                .buildingId(1L)
                .buildingCode("BD01")
                .buildingName("Building 01")
                .build();
        InvoiceResponse invoice = invoice(InvoiceStatus.UNPAID);
        RentalContractResponse contract = RentalContractResponse.builder()
                .id(41L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .rentalStatus(RentalStatus.ACTIVE)
                .endDate(LocalDate.now().plusDays(10))
                .build();

        when(dashboardService.getResidentDashboard(3L)).thenReturn(ResidentDashboardResponse.builder()
                .currentRoom(assignment)
                .currentContract(contract)
                .latestInvoice(invoice)
                .approvedMemberCount(1)
                .unreadNotifications(1)
                .recentMaintenanceRequests(List.of(maintenance()))
                .build());
        when(roomMemberService.getResidentMembers(3L)).thenReturn(List.of(RoomMemberResponse.builder()
                .id(61L)
                .fullName("Approved Member")
                .status(RoomMemberStatus.APPROVED)
                .build()));
        when(vehicleService.getResidentVehicles(3L)).thenReturn(List.of(VehicleResponse.builder()
                .id(71L)
                .licensePlate("30A-12345")
                .status(VehicleStatus.ACTIVE)
                .build()));
        when(invoiceService.getResidentInvoices(3L)).thenReturn(List.of(invoice));
        when(maintenanceRequestService.getResidentRequests(3L)).thenReturn(List.of(maintenance()));
        when(notificationService.getResidentNotifications(3L)).thenReturn(List.of(NotificationResponse.builder()
                .id(81L)
                .title("Resident notice")
                .content("Own room notice")
                .build()));

        Map<String, Object> context = new ResidentChatContextBuilder(
                dashboardService,
                roomMemberService,
                vehicleService,
                invoiceService,
                maintenanceRequestService,
                notificationService
        ).build(resident);

        Map<String, Object> currentRoom = map(map(context.get("summary")).get("currentRoom"));
        assertThat(currentRoom.get("roomCode")).isEqualTo("BD01-P101");
        assertThat(list(currentRoom, "activeMembers")).hasSize(1);
        assertThat(list(currentRoom, "activeVehicles")).hasSize(1);
        assertThat(list(currentRoom, "recentNotifications")).hasSize(1);
        assertThat(list(context, "buildings")).hasSize(1);
        assertThat(list(context, "invoicesNeedingAttention")).hasSize(1);
        assertThat(context).doesNotContainKeys("tasks", "roomsNeedingAttention");
        assertThat(currentRoom).doesNotContainKeys("roomId", "buildingId");
        assertThat(map(list(currentRoom, "activeMembers").get(0))).doesNotContainKey("memberId");
        assertThat(map(list(currentRoom, "activeVehicles").get(0))).doesNotContainKey("vehicleId");
    }

    private BuildingResponse building() {
        return BuildingResponse.builder()
                .id(1L)
                .buildingCode("BD01")
                .name("Building 01")
                .build();
    }

    private RoomResponse room() {
        return RoomResponse.builder()
                .id(11L)
                .buildingId(1L)
                .buildingCode("BD01")
                .buildingName("Building 01")
                .roomCode("BD01-P101")
                .roomName("Room 101")
                .status(RoomStatus.OCCUPIED)
                .build();
    }

    private InvoiceResponse invoice(InvoiceStatus status) {
        return InvoiceResponse.builder()
                .id(31L)
                .roomId(11L)
                .buildingId(1L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .residentHeadName("Resident")
                .month(YearMonth.now().toString())
                .totalAmount(BigDecimal.valueOf(5000000))
                .dueDate(LocalDate.now().plusDays(5))
                .status(status)
                .build();
    }

    private MaintenanceRequestResponse maintenance() {
        return MaintenanceRequestResponse.builder()
                .id(91L)
                .buildingId(1L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .title("Repair request")
                .status(MaintenanceStatus.IN_PROGRESS)
                .build();
    }

    private MaintenanceRequestResponse maintenance(
            String title,
            MaintenanceStatus status,
            LocalDateTime createdAt
    ) {
        return MaintenanceRequestResponse.builder()
                .id(91L)
                .buildingId(1L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .title(title)
                .status(status)
                .createdAt(createdAt)
                .build();
    }

    private TaskResponse task() {
        return TaskResponse.builder()
                .id(101L)
                .buildingId(1L)
                .buildingCode("BD01")
                .roomCode("BD01-P101")
                .title("Inspect room")
                .status(TaskStatus.IN_PROGRESS)
                .build();
    }

    private CashFlowResponse cashFlow() {
        return CashFlowResponse.builder()
                .month(YearMonth.now().toString())
                .totalIncome(BigDecimal.TEN)
                .totalExpense(BigDecimal.ONE)
                .remainingCash(BigDecimal.valueOf(9))
                .unpaidAmount(BigDecimal.ZERO)
                .build();
    }

    private User user(Long id, UserRole role) {
        return User.builder().id(id).role(role).build();
    }

    @SuppressWarnings("unchecked")
    private List<Object> list(Map<String, Object> source, String key) {
        return (List<Object>) source.get(key);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Object value) {
        return (Map<String, Object>) value;
    }
}
