package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.service.BusinessRuleContextProvider;
import com.tropilot.service.ChatRoleContextBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
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
    private ChatRoleContextBuilder adminBuilder;

    @Mock
    private ChatRoleContextBuilder staffBuilder;

    @Mock
    private ChatRoleContextBuilder residentBuilder;

    @Mock
    private BusinessRuleContextProvider businessRuleContextProvider;

    private ObjectMapper objectMapper;
    private ChatContextServiceImpl service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        when(adminBuilder.getSupportedRole()).thenReturn(UserRole.ADMIN);
        when(staffBuilder.getSupportedRole()).thenReturn(UserRole.STAFF);
        when(residentBuilder.getSupportedRole()).thenReturn(UserRole.RESIDENT_HEAD);
        lenient().when(businessRuleContextProvider.getBusinessRules()).thenReturn(
                objectMapper.createObjectNode().put("version", "1.0")
        );
        service = new ChatContextServiceImpl(
                List.of(adminBuilder, staffBuilder, residentBuilder),
                businessRuleContextProvider,
                objectMapper
        );
    }

    @Test
    void buildContextUsesCommonSchemaAndOnlyTheAuthenticatedRoleBuilder() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(adminBuilder.build(admin)).thenReturn(Map.of(
                "summary", Map.of("totalBuildings", 4),
                "buildings", List.of(Map.of("buildingCode", "BD01"))
        ));

        JsonNode context = objectMapper.readTree(service.buildContext(admin, "Give me the system overview"));

        assertCommonSchema(context, "ADMIN", "GLOBAL_ADMIN");
        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("buildings").get(0).path("buildingCode").asText()).isEqualTo("BD01");
        verify(adminBuilder).build(admin);
    }

    @Test
    void buildContextRejectsUnsupportedBuilderFields() {
        User staff = user(2L, UserRole.STAFF);
        when(staffBuilder.build(staff)).thenReturn(Map.of("bankCredentials", "not-allowed"));

        assertThatThrownBy(() -> service.buildContext(staff, "Show my tasks"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsupported role chat context field");
    }

    @Test
    void buildContextKeepsOnlyInvoiceDetailsForInvoiceQuestions() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(adminBuilder.build(admin)).thenReturn(contextWithAllDetails());

        JsonNode context = objectMapper.readTree(service.buildContext(admin, "Hoa don nao chua thanh toan?"));

        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("buildings").size()).isEqualTo(1);
        assertThat(context.path("invoicesNeedingAttention").size()).isEqualTo(1);
        assertThat(context.path("roomsNeedingAttention").size()).isEqualTo(1);
        assertThat(context.path("roomsNeedingAttention").get(0).path("roomCode").asText()).isEqualTo("BD01-P101");
        assertThat(context.path("expiringContracts").size()).isZero();
        assertThat(context.path("maintenanceRequests").size()).isZero();
        assertThat(context.path("tasks").size()).isZero();
    }

    @Test
    void buildContextKeepsOnlyUtilityRoomsForUtilityQuestions() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(adminBuilder.build(admin)).thenReturn(contextWithAllDetails());

        JsonNode context = objectMapper.readTree(service.buildContext(admin, "Phong nao chua ghi chi so dien nuoc?"));

        assertThat(context.path("roomsNeedingAttention").size()).isEqualTo(1);
        assertThat(context.path("roomsNeedingAttention").get(0).path("roomCode").asText()).isEqualTo("BD01-P102");
        assertThat(context.path("invoicesNeedingAttention").size()).isZero();
        assertThat(context.path("expiringContracts").size()).isZero();
        assertThat(context.path("maintenanceRequests").size()).isZero();
        assertThat(context.path("tasks").size()).isZero();
    }

    @Test
    void buildContextKeepsOverviewOnlyWhenQuestionTopicIsUnknown() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(adminBuilder.build(admin)).thenReturn(contextWithAllDetails());

        JsonNode context = objectMapper.readTree(service.buildContext(admin, "Xin chao"));

        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("buildings").size()).isEqualTo(1);
        assertThat(context.path("roomsNeedingAttention").size()).isZero();
        assertThat(context.path("invoicesNeedingAttention").size()).isZero();
        assertThat(context.path("expiringContracts").size()).isZero();
        assertThat(context.path("maintenanceRequests").size()).isZero();
        assertThat(context.path("tasks").size()).isZero();
    }

    @Test
    void buildContextUsesRoleDataScopes() throws Exception {
        User staff = user(2L, UserRole.STAFF);
        User resident = user(3L, UserRole.RESIDENT_HEAD);
        when(staffBuilder.build(staff)).thenReturn(Map.of("summary", Map.of("assignedTasks", 2)));
        when(residentBuilder.build(resident)).thenReturn(Map.of(
                "summary", Map.of("currentRoom", Map.of("assigned", true, "roomCode", "BD01-P101"))
        ));

        JsonNode staffContext = objectMapper.readTree(service.buildContext(staff, "Show my tasks"));
        JsonNode residentContext = objectMapper.readTree(service.buildContext(resident, "Show my invoice"));

        assertThat(staffContext.path("user").path("dataScope").asText()).isEqualTo("STAFF_OPERATIONAL");
        assertThat(residentContext.path("user").path("dataScope").asText()).isEqualTo("RESIDENT_OWN_ROOM_ONLY");
    }

    @Test
    void buildContextRemovesSensitiveValuesFromAllowedFields() throws Exception {
        User admin = user(1L, UserRole.ADMIN);
        when(adminBuilder.build(admin)).thenReturn(Map.of(
                "summary", Map.of(
                        "totalBuildings", 4,
                        "temporaryPassword", "Temp@123",
                        "jwtToken", "raw.jwt.token"
                ),
                "buildings", List.of(Map.of(
                        "buildingCode", "BD01",
                        "webhookSecret", "sepay-secret",
                        "geminiApiKey", "gemini-key"
                )),
                "invoicesNeedingAttention", List.of(Map.of(
                        "roomCode", "BD01-P101",
                        "authorizationHeader", "Bearer token"
                ))
        ));

        String rawContext = service.buildContext(
                admin,
                "Show invoices and payments for all buildings"
        );
        JsonNode context = objectMapper.readTree(rawContext);

        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("buildings").get(0).path("buildingCode").asText()).isEqualTo("BD01");
        assertThat(rawContext)
                .doesNotContain("temporaryPassword")
                .doesNotContain("Temp@123")
                .doesNotContain("jwtToken")
                .doesNotContain("raw.jwt.token")
                .doesNotContain("webhookSecret")
                .doesNotContain("sepay-secret")
                .doesNotContain("geminiApiKey")
                .doesNotContain("gemini-key")
                .doesNotContain("authorizationHeader")
                .doesNotContain("Bearer token");
    }

    @Test
    void constructorRejectsDuplicateRoleBuilders() {
        ChatRoleContextBuilder duplicateAdmin = org.mockito.Mockito.mock(ChatRoleContextBuilder.class);
        when(duplicateAdmin.getSupportedRole()).thenReturn(UserRole.ADMIN);

        assertThatThrownBy(() -> new ChatContextServiceImpl(
                List.of(adminBuilder, duplicateAdmin),
                businessRuleContextProvider,
                objectMapper
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Multiple chat context builders");
    }

    private User user(Long id, UserRole role) {
        return User.builder()
                .id(id)
                .role(role)
                .build();
    }

    private Map<String, Object> contextWithAllDetails() {
        return Map.of(
                "summary", Map.of("totalBuildings", 4),
                "buildings", List.of(Map.of("buildingCode", "BD01")),
                "roomsNeedingAttention", List.of(
                        Map.of(
                                "roomCode", "BD01-P101",
                                "reasons", List.of("MISSING_CURRENT_INVOICE")
                        ),
                        Map.of(
                                "roomCode", "BD01-P102",
                                "reasons", List.of("MISSING_UTILITY_READING")
                        )
                ),
                "invoicesNeedingAttention", List.of(Map.of("roomCode", "BD01-P101")),
                "expiringContracts", List.of(Map.of("roomCode", "BD01-P103")),
                "maintenanceRequests", List.of(Map.of("title", "Fix camera")),
                "tasks", List.of(Map.of("title", "Read meters"))
        );
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
        assertThat(context.path("businessRules").path("version").asText()).isEqualTo("1.0");
        assertThat(context.path("summary").isObject()).isTrue();
        assertThat(context.path("buildings").isArray()).isTrue();
    }
}
