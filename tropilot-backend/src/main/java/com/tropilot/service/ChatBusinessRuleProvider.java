package com.tropilot.service;

import com.fasterxml.jackson.databind.JsonNode;

public interface ChatBusinessRuleProvider {

    JsonNode getBusinessRules();
}
