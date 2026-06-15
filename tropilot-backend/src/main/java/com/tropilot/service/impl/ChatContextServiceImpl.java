package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.service.BusinessRuleContextProvider;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.ChatRoleContextBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ChatContextServiceImpl implements ChatContextService {

    private static final DateTimeFormatter CONTEXT_TIMESTAMP_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String GLOBAL_ADMIN_SCOPE = "GLOBAL_ADMIN";
    private static final String STAFF_OPERATIONAL_SCOPE = "STAFF_OPERATIONAL";
    private static final String RESIDENT_OWN_ROOM_SCOPE = "RESIDENT_OWN_ROOM_ONLY";
    private static final Set<String> ROLE_CONTEXT_FIELDS = Set.of(
            "summary",
            "buildings",
            "roomsNeedingAttention",
            "invoicesNeedingAttention",
            "expiringContracts",
            "maintenanceRequests",
            "tasks"
    );

    private final Map<UserRole, ChatRoleContextBuilder> buildersByRole;
    private final BusinessRuleContextProvider businessRuleContextProvider;
    private final ObjectMapper objectMapper;

    public ChatContextServiceImpl(
            List<ChatRoleContextBuilder> builders,
            BusinessRuleContextProvider businessRuleContextProvider,
            ObjectMapper objectMapper
    ) {
        this.buildersByRole = builders.stream()
                .collect(Collectors.toMap(
                        ChatRoleContextBuilder::getSupportedRole,
                        Function.identity(),
                        (first, second) -> {
                            throw new IllegalStateException(
                                    "Multiple chat context builders registered for role " + first.getSupportedRole()
                            );
                        },
                        () -> new EnumMap<>(UserRole.class)
                ));
        this.businessRuleContextProvider = businessRuleContextProvider;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public String buildContext(User user) {
        Map<String, Object> context = createBaseContext(user);
        mergeRoleContext(context, findBuilder(user).build(user));

        return objectMapper.valueToTree(context).toString();
    }

    private Map<String, Object> createBaseContext(User user) {
        Map<String, Object> context = new LinkedHashMap<>();
        Map<String, Object> userContext = new LinkedHashMap<>();

        userContext.put("role", user.getRole().name());
        userContext.put("dataScope", resolveDataScope(user));

        context.put("generatedAt", LocalDateTime.now().format(CONTEXT_TIMESTAMP_FORMAT));
        context.put("user", userContext);
        context.put("businessRules", businessRuleContextProvider.getBusinessRules());
        context.put("summary", new LinkedHashMap<>());
        context.put("buildings", List.of());
        context.put("roomsNeedingAttention", List.of());
        context.put("invoicesNeedingAttention", List.of());
        context.put("expiringContracts", List.of());
        context.put("maintenanceRequests", List.of());
        context.put("tasks", List.of());
        return context;
    }

    private ChatRoleContextBuilder findBuilder(User user) {
        ChatRoleContextBuilder builder = buildersByRole.get(user.getRole());
        if (builder == null) {
            throw new IllegalStateException("No chat context builder registered for role " + user.getRole());
        }
        return builder;
    }

    private void mergeRoleContext(Map<String, Object> context, Map<String, Object> roleContext) {
        roleContext.forEach((field, value) -> {
            if (!ROLE_CONTEXT_FIELDS.contains(field)) {
                throw new IllegalStateException("Unsupported role chat context field " + field);
            }
            context.put(field, value);
        });
    }

    private String resolveDataScope(User user) {
        return switch (user.getRole()) {
            case ADMIN -> GLOBAL_ADMIN_SCOPE;
            case STAFF -> STAFF_OPERATIONAL_SCOPE;
            case RESIDENT_HEAD -> RESIDENT_OWN_ROOM_SCOPE;
        };
    }
}
