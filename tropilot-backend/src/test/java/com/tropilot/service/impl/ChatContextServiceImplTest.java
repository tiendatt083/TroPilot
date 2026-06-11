package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatContextServiceImplTest {

    @Mock
    private DashboardService dashboardService;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Test
    void buildContextIncludesExactAdminDashboardMetrics() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        ChatContextServiceImpl service = new ChatContextServiceImpl(
                dashboardService,
                buildingRepository,
                roomRepository,
                objectMapper
        );
        User admin = User.builder()
                .id(1L)
                .role(UserRole.ADMIN)
                .build();

        when(dashboardService.getAdminDashboard()).thenReturn(AdminDashboardResponse.builder()
                .totalBuildings(4)
                .totalRooms(27)
                .occupiedRooms(18)
                .emptyRooms(8)
                .maintenanceRooms(1)
                .build());

        JsonNode context = objectMapper.readTree(service.buildContext(admin));

        assertThat(context.path("dataScope").asText()).isEqualTo("GLOBAL_ADMIN");
        assertThat(context.path("metrics").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("metrics").path("totalRooms").asLong()).isEqualTo(27);
        assertThat(context.path("metrics").path("occupiedRooms").asLong()).isEqualTo(18);
    }
}
