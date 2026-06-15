package com.tropilot.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tropilot.service.BusinessRuleContextProvider;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

@Component
public class ClasspathBusinessRuleContextProvider implements BusinessRuleContextProvider {

    static final String BUSINESS_RULES_PATH = "chat/tropilot-business-rules.json";

    private final JsonNode businessRules;

    public ClasspathBusinessRuleContextProvider(ObjectMapper objectMapper) {
        this.businessRules = loadBusinessRules(objectMapper);
    }

    @Override
    public JsonNode getBusinessRules() {
        return businessRules.deepCopy();
    }

    private JsonNode loadBusinessRules(ObjectMapper objectMapper) {
        ClassPathResource resource = new ClassPathResource(BUSINESS_RULES_PATH);

        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode loadedRules = objectMapper.readTree(inputStream);

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
}
