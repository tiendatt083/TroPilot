package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.ChatBusinessRuleProvider;
import com.tropilot.service.DashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatContextServiceImplTest {

    private static final Set<String> COMMON_CONTEXT_FIELDS = Set.of(
            "generatedAt",
            "user",
            "businessRules",
            "summary",
            "buildings",
            "roomsNeedingAttention",
            "invoicesNeedingAttention",
            "expiringContracts",
            "maintenanceRequests",
            "tasks"
    );

    @Mock
    private DashboardService dashboardService;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private ChatBusinessRuleProvider chatBusinessRuleProvider;

    private ObjectMapper objectMapper;
    private ChatContextServiceImpl service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        when(chatBusinessRuleProvider.getBusinessRules()).thenReturn(
                objectMapper.createObjectNode().put("version", "1.0")
        );
        service = new ChatContextServiceImpl(
                dashboardService,
                buildingRepository,
                roomRepository,
                chatBusinessRuleProvider,
                objectMapper
        );
    }

    @Test
    void buildContextUsesCommonSchemaAndExactAdminSummary() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .totalBuildings(4)
                .totalRooms(27)
                .occupiedRooms(18)
                .emptyRooms(8)
                .maintenanceRooms(1)
                .totalHeadResidents(12)
                .totalApprovedRoomMembers(20)
                .totalOccupants(32)
                .build());

        JsonNode context = readContext(admin);

        assertCommonSchema(context, "ADMIN", "GLOBAL_ADMIN");
        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("summary").path("totalRooms").asLong()).isEqualTo(27);
        assertThat(context.path("summary").path("occupiedRooms").asLong()).isEqualTo(18);
        assertThat(context.path("summary").path("totalOccupants").asLong()).isEqualTo(32);
        assertThat(context.has("metrics")).isFalse();
        assertThat(context.has("userRole")).isFalse();
        assertThat(context.has("dataScope")).isFalse();
    }

    @Test
    void buildContextUsesStaffScopeAndOperationalSummary() throws Exception {
        User staff = user(2L, UserRole.STAFF);
        when(dashboardService.getStaffDashboard(staff.getId())).thenReturn(StaffDashboardResponse.builder()
                .assignedTasks(5)
                .overdueTasks(1)
                .roomsNeedingUtilityReading(3)
                .pendingPaymentConfirmations(2)
                .activeMaintenanceRequests(4)
                .createdExpenses(6)
                .build());
        when(buildingRepository.count()).thenReturn(3L);
        when(roomRepository.count()).thenReturn(20L);
        when(roomRepository.countByStatus(RoomStatus.EMPTY)).thenReturn(4L);
        when(roomRepository.countByStatus(RoomStatus.OCCUPIED)).thenReturn(15L);
        when(roomRepository.countByStatus(RoomStatus.MAINTENANCE)).thenReturn(1L);

        JsonNode context = readContext(staff);

        assertCommonSchema(context, "STAFF", "STAFF_OPERATIONAL");
        assertThat(context.path("summary").path("assignedTasks").asLong()).isEqualTo(5);
        assertThat(context.path("summary").path("roomsNeedingUtilityReading").asLong()).isEqualTo(3);
        assertThat(context.path("summary").path("totalRooms").asLong()).isEqualTo(20);
    }

    @Test
    void buildContextUsesResidentScopeAndStoresRoomDtoDataInsideSummary() throws Exception {
        User resident = user(3L, UserRole.RESIDENT_HEAD);
        HeadResidentAssignmentResponse room = HeadResidentAssignmentResponse.builder()
                .assigned(true)
                .roomCode("BD01-P101")
                .roomName("Room 101")
                .roomStatus(RoomStatus.OCCUPIED)
                .buildingCode("BD01")
                .buildingName("Building 01")
                .build();
        when(dashboardService.getResidentDashboard(resident.getId())).thenReturn(ResidentDashboardResponse.builder()
                .currentRoom(room)
                .approvedMemberCount(2)
                .activeVehicles(List.of())
                .recentMaintenanceRequests(List.of())
                .unreadNotifications(3)
                .build());

        JsonNode context = readContext(resident);

        assertCommonSchema(context, "RESIDENT_HEAD", "RESIDENT_OWN_ROOM_ONLY");
        JsonNode currentRoom = context.path("summary").path("currentRoom");
        assertThat(currentRoom.path("assigned").asBoolean()).isTrue();
        assertThat(currentRoom.path("roomCode").asText()).isEqualTo("BD01-P101");
        assertThat(currentRoom.path("approvedMemberCount").asLong()).isEqualTo(2);
        assertThat(currentRoom.path("activeVehicleCount").asLong()).isZero();
        assertThat(context.has("ownRoom")).isFalse();
    }

    private JsonNode readContext(User user) throws Exception {
        return objectMapper.readTree(service.buildContext(user));
    }

    private User user(Long id, UserRole role) {
        return User.builder()
                .id(id)
                .role(role)
                .build();
    }

    private void assertCommonSchema(JsonNode context, String role, String dataScope) {
        Set<String> actualFields = StreamSupport.stream(
                        ((Iterable<String>) context::fieldNames).spliterator(),
                        false
                )
                .collect(Collectors.toSet());

        assertThat(actualFields).isEqualTo(COMMON_CONTEXT_FIELDS);
        assertThat(context.path("generatedAt").asText()).matches("\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}");
        assertThat(context.path("user").path("role").asText()).isEqualTo(role);
        assertThat(context.path("user").path("dataScope").asText()).isEqualTo(dataScope);
        assertThat(context.path("user").size()).isEqualTo(2);
        assertThat(context.path("businessRules").isObject()).isTrue();
        assertThat(context.path("businessRules").path("version").asText()).isEqualTo("1.0");
        assertThat(context.path("summary").isObject()).isTrue();
        assertThat(context.path("buildings").isArray()).isTrue();
        assertThat(context.path("roomsNeedingAttention").isArray()).isTrue();
        assertThat(context.path("invoicesNeedingAttention").isArray()).isTrue();
        assertThat(context.path("expiringContracts").isArray()).isTrue();
        assertThat(context.path("maintenanceRequests").isArray()).isTrue();
        assertThat(context.path("tasks").isArray()).isTrue();
    }
}
