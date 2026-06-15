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

        JsonNode context = objectMapper.readTree(service.buildContext(admin));

        assertCommonSchema(context, "ADMIN", "GLOBAL_ADMIN");
        assertThat(context.path("summary").path("totalBuildings").asLong()).isEqualTo(4);
        assertThat(context.path("buildings").get(0).path("buildingCode").asText()).isEqualTo("BD01");
        verify(adminBuilder).build(admin);
    }

    @Test
    void buildContextRejectsUnsupportedBuilderFields() {
        User staff = user(2L, UserRole.STAFF);
        when(staffBuilder.build(staff)).thenReturn(Map.of("bankCredentials", "not-allowed"));

        assertThatThrownBy(() -> service.buildContext(staff))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Unsupported role chat context field");
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
