package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.service.BusinessRuleContextProvider;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.ChatRoleContextBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
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
    private static final String MISSING_CURRENT_INVOICE_REASON = "MISSING_CURRENT_INVOICE";
    private static final String MISSING_UTILITY_READING_REASON = "MISSING_UTILITY_READING";
    private static final Set<String> SENSITIVE_KEY_MARKERS = Set.of(
            "password",
            "token",
            "secret",
            "apikey",
            "authorization",
            "jwt"
    );
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
    public String buildContext(User user, String message) {
        Map<String, Object> context = createBaseContext(user);
        Set<ChatContextTopic> topics = classifyTopics(message);
        Map<String, Object> roleContext = filterRoleContext(findBuilder(user).build(user), topics);
        mergeRoleContext(context, roleContext);

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

    private Map<String, Object> filterRoleContext(Map<String, Object> roleContext, Set<ChatContextTopic> topics) {
        validateRoleContextFields(roleContext);

        Map<String, Object> filtered = new LinkedHashMap<>();
        putIfPresent(filtered, roleContext, "summary");
        putIfPresent(filtered, roleContext, "buildings");

        if (topics.contains(ChatContextTopic.OVERVIEW)) {
            return filtered;
        }

        List<Map<String, Object>> roomsNeedingAttention = filterRoomsNeedingAttention(
                roleContext.get("roomsNeedingAttention"),
                topics
        );
        if (!roomsNeedingAttention.isEmpty()) {
            filtered.put("roomsNeedingAttention", roomsNeedingAttention);
        }
        if (topics.contains(ChatContextTopic.INVOICE)) {
            putIfPresent(filtered, roleContext, "invoicesNeedingAttention");
        }
        if (topics.contains(ChatContextTopic.CONTRACT)) {
            putIfPresent(filtered, roleContext, "expiringContracts");
        }
        if (topics.contains(ChatContextTopic.MAINTENANCE)) {
            putIfPresent(filtered, roleContext, "maintenanceRequests");
        }
        if (topics.contains(ChatContextTopic.TASK)) {
            putIfPresent(filtered, roleContext, "tasks");
        }
        return filtered;
    }

    private void validateRoleContextFields(Map<String, Object> roleContext) {
        roleContext.keySet().forEach(field -> {
            if (!ROLE_CONTEXT_FIELDS.contains(field)) {
                throw new IllegalStateException("Unsupported role chat context field " + field);
            }
        });
    }

    private void putIfPresent(Map<String, Object> target, Map<String, Object> source, String field) {
        if (source.containsKey(field)) {
            target.put(field, sanitizeValue(source.get(field)));
        }
    }

    private List<Map<String, Object>> filterRoomsNeedingAttention(Object value, Set<ChatContextTopic> topics) {
        Set<String> acceptedReasons = resolveRoomAttentionReasons(topics);
        if (acceptedReasons.isEmpty() || !(value instanceof List<?> records)) {
            return List.of();
        }

        return records.stream()
                .filter(Map.class::isInstance)
                .map(record -> castMap(record))
                .filter(room -> hasAnyReason(room, acceptedReasons))
                .map(this::sanitizeMap)
                .toList();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> castMap(Object record) {
        return (Map<String, Object>) record;
    }

    private Set<String> resolveRoomAttentionReasons(Set<ChatContextTopic> topics) {
        Set<String> reasons = new java.util.LinkedHashSet<>();
        if (topics.contains(ChatContextTopic.INVOICE)) {
            reasons.add(MISSING_CURRENT_INVOICE_REASON);
        }
        if (topics.contains(ChatContextTopic.UTILITY)) {
            reasons.add(MISSING_UTILITY_READING_REASON);
        }
        return reasons;
    }

    private boolean hasAnyReason(Map<String, Object> room, Set<String> acceptedReasons) {
        Object value = room.get("reasons");
        if (!(value instanceof List<?> reasons)) {
            return false;
        }
        return reasons.stream()
                .map(String::valueOf)
                .anyMatch(acceptedReasons::contains);
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

    private Map<String, Object> sanitizeMap(Map<String, Object> value) {
        return castMap(sanitizeValue(value));
    }

    private boolean isSensitiveKey(String key) {
        String normalizedKey = key.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        return SENSITIVE_KEY_MARKERS.stream().anyMatch(normalizedKey::contains);
    }

    private Set<ChatContextTopic> classifyTopics(String message) {
        String text = normalize(message);
        Set<ChatContextTopic> topics = EnumSet.noneOf(ChatContextTopic.class);

        if (containsAny(text, "hoa don", "thanh toan", "bien lai", "invoice", "payment", "receipt")) {
            topics.add(ChatContextTopic.INVOICE);
        }
        if (containsAny(text, "dien", "nuoc", "chi so", "utility", "reading", "meter")) {
            topics.add(ChatContextTopic.UTILITY);
        }
        if (containsAny(text, "hop dong", "contract")) {
            topics.add(ChatContextTopic.CONTRACT);
        }
        if (containsAny(text, "bao tri", "thiet bi", "maintenance", "equipment")) {
            topics.add(ChatContextTopic.MAINTENANCE);
        }
        if (containsAny(text, "cong viec", "nhiem vu", "task")) {
            topics.add(ChatContextTopic.TASK);
        }
        return topics.isEmpty() ? EnumSet.of(ChatContextTopic.OVERVIEW) : topics;
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

    private String resolveDataScope(User user) {
        return switch (user.getRole()) {
            case ADMIN -> GLOBAL_ADMIN_SCOPE;
            case STAFF -> STAFF_OPERATIONAL_SCOPE;
            case RESIDENT_HEAD -> RESIDENT_OWN_ROOM_SCOPE;
        };
    }

    private enum ChatContextTopic {
        OVERVIEW,
        INVOICE,
        UTILITY,
        CONTRACT,
        MAINTENANCE,
        TASK
    }
}
