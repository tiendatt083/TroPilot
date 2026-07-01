package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.BuildingResponse;
import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.RoomResponse;
import com.tropilot.dto.response.UtilityReadingOverviewResponse;
import com.tropilot.dto.response.VehicleResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.RoomStatus;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatContextServiceImplTest {

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

    private ObjectMapper objectMapper;
    private ChatContextServiceImpl service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        service = new ChatContextServiceImpl(
                objectMapper,
                dashboardService,
                buildingService,
                roomService,
                invoiceService,
                rentalContractService,
                utilityReadingService,
                maintenanceRequestService,
                taskService,
                cashFlowService,
                paymentService,
                roomMemberService,
                vehicleService,
                notificationService
        );
    }

    @Test
    void buildContextUsesRuleJsonAndAdminBillingData() throws Exception {
        String month = YearMonth.now().toString();
        BuildingResponse building = BuildingResponse.builder()
                .id(1L)
                .buildingCode("GDP")
                .name("GoldenPark")
                .address("Demo address")
                .build();
        RoomResponse room = RoomResponse.builder()
                .id(11L)
                .buildingCode("GDP")
                .buildingName("GoldenPark")
                .roomCode("GDP-101")
                .roomName("Room 101")
                .status(RoomStatus.OCCUPIED)
                .build();
        InvoiceResponse invoice = InvoiceResponse.builder()
                .id(21L)
                .buildingCode("GDP")
                .roomCode("GDP-101")
                .residentHeadName("Resident")
                .month(month)
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(5))
                .totalAmount(BigDecimal.valueOf(2500000))
                .status(InvoiceStatus.UNPAID)
                .build();

        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .totalBuildings(1)
                .totalRooms(1)
                .occupiedRooms(1)
                .unpaidInvoices(1)
                .unpaidAmount(BigDecimal.valueOf(2500000))
                .build());
        when(buildingService.getBuildings(null)).thenReturn(List.of(building));
        when(roomService.getRooms(1L, null, null)).thenReturn(List.of(room));
        when(invoiceService.getBuildingInvoices(1L)).thenReturn(List.of(invoice));
        when(rentalContractService.getContracts(1L)).thenReturn(List.of());
        when(utilityReadingService.getOverview(1L, month)).thenReturn(UtilityReadingOverviewResponse.builder()
                .month(month)
                .pendingRooms(0)
                .eligibleRooms(List.of())
                .build());
        when(cashFlowService.getCashFlow(month, 1L)).thenReturn(CashFlowResponse.builder()
                .month(month)
                .unpaidAmount(BigDecimal.valueOf(2500000))
                .build());

        JsonNode context = objectMapper.readTree(service.buildContext(
                user(1L, UserRole.ADMIN),
                "Hoa don nao chua thanh toan?"
        ));

        assertThat(context.path("businessRules").path("version").asText()).isNotBlank();
        assertThat(context.path("matchedTopics").get(0).asText()).isEqualTo("BILLING");
        assertThat(context.path("user").path("dataScope").asText()).isEqualTo("GLOBAL_ADMIN");
        assertThat(context.path("data").path("summary").path("totalBuildings").asInt()).isEqualTo(1);
        assertThat(context.path("data").path("buildings").get(0).path("unpaidInvoices").asInt()).isEqualTo(1);
        assertThat(context.path("data").path("invoices").get(0).path("roomCode").asText()).isEqualTo("GDP-101");
        assertThat(context.toString()).doesNotContain("invoiceId");
    }

    @Test
    void buildContextKeepsResidentDataScopedToOwnRoom() throws Exception {
        HeadResidentAssignmentResponse assignment = HeadResidentAssignmentResponse.builder()
                .assigned(true)
                .roomCode("GDP-101")
                .roomName("Room 101")
                .roomStatus(RoomStatus.OCCUPIED)
                .buildingCode("GDP")
                .buildingName("GoldenPark")
                .build();
        InvoiceResponse invoice = InvoiceResponse.builder()
                .buildingCode("GDP")
                .roomCode("GDP-101")
                .month(YearMonth.now().toString())
                .totalAmount(BigDecimal.valueOf(2500000))
                .status(InvoiceStatus.UNPAID)
                .build();

        when(dashboardService.getResidentDashboard(7L)).thenReturn(ResidentDashboardResponse.builder()
                .currentRoom(assignment)
                .latestInvoice(invoice)
                .approvedMemberCount(1)
                .unreadNotifications(0)
                .recentMaintenanceRequests(List.of())
                .build());
        when(roomMemberService.getResidentMembers(7L)).thenReturn(List.of());
        when(vehicleService.getResidentVehicles(7L)).thenReturn(List.of(VehicleResponse.builder()
                .licensePlate("30A-12345")
                .status(VehicleStatus.ACTIVE)
                .build()));
        when(invoiceService.getResidentInvoices(7L)).thenReturn(List.of(invoice));

        JsonNode context = objectMapper.readTree(service.buildContext(
                user(7L, UserRole.RESIDENT_HEAD),
                "Hoa don phong toi the nao?"
        ));

        assertThat(context.path("user").path("dataScope").asText()).isEqualTo("RESIDENT_OWN_ROOM_ONLY");
        assertThat(context.path("data").path("currentRoom").path("roomCode").asText()).isEqualTo("GDP-101");
        assertThat(context.path("data").path("invoices").get(0).path("roomCode").asText()).isEqualTo("GDP-101");
        assertThat(context.toString()).doesNotContain("roomId").doesNotContain("buildingId");
    }

    private User user(Long id, UserRole role) {
        return User.builder()
                .id(id)
                .role(role)
                .build();
    }
}
