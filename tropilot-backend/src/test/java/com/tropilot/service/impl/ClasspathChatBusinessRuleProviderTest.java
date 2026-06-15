package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static org.assertj.core.api.Assertions.assertThat;

class ClasspathChatBusinessRuleProviderTest {

    private static final Set<String> REQUIRED_SECTIONS = Set.of(
            "version",
            "headResidentAndMembers",
            "occupancyLimits",
            "contracts",
            "utilityReadings",
            "invoices",
            "serviceFees",
            "sepayPayments",
            "permissions"
    );

    @Test
    void loadsCompleteBusinessRulesFromClasspath() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        ClasspathChatBusinessRuleProvider provider = new ClasspathChatBusinessRuleProvider(objectMapper);

        JsonNode rules = provider.getBusinessRules();
        Set<String> actualSections = StreamSupport.stream(
                        ((Iterable<String>) rules::fieldNames).spliterator(),
                        false
                )
                .collect(Collectors.toSet());

        assertThat(actualSections).isEqualTo(REQUIRED_SECTIONS);
        assertThat(rules.path("headResidentAndMembers")).isNotEmpty();
        assertThat(rules.path("occupancyLimits")).isNotEmpty();
        assertThat(rules.path("contracts")).isNotEmpty();
        assertThat(rules.path("utilityReadings")).isNotEmpty();
        assertThat(rules.path("invoices")).isNotEmpty();
        assertThat(rules.path("serviceFees")).isNotEmpty();
        assertThat(rules.path("sepayPayments")).isNotEmpty();
        assertThat(rules.path("permissions").path("ADMIN")).isNotEmpty();
        assertThat(rules.path("permissions").path("STAFF")).isNotEmpty();
        assertThat(rules.path("permissions").path("RESIDENT_HEAD")).isNotEmpty();
    }

    @Test
    void returnsIndependentRuleCopies() {
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        ClasspathChatBusinessRuleProvider provider = new ClasspathChatBusinessRuleProvider(objectMapper);

        JsonNode firstCopy = provider.getBusinessRules();
        firstCopy.withObject("/permissions").remove("ADMIN");

        assertThat(provider.getBusinessRules().path("permissions").path("ADMIN")).isNotEmpty();
    }
}
