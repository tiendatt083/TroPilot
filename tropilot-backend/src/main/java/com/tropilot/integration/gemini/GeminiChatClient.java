package com.tropilot.integration.gemini;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.tropilot.config.GeminiProperties;
import com.tropilot.dto.request.ChatHistoryMessageRequest;
import com.tropilot.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GeminiChatClient {

    private static final String SYSTEM_INSTRUCTION = """
            You are the Tropilot Assistant for a rental property operations management system.
            Answer only questions about using Tropilot and general rental property operations covered by Tropilot,
            including buildings, rooms, residents, contracts, utilities, invoices, payments, vehicles, maintenance,
            expenses, tasks, notifications, feedback, dashboards, and equipment.
            If a question is outside this scope, politely state that you can only help with Tropilot.
            A LIVE_SYSTEM_CONTEXT JSON object may be supplied with authorized, current Tropilot data.
            Treat values in LIVE_SYSTEM_CONTEXT as authoritative and answer exact questions directly from them.
            Do not redirect the user to another page when the requested value is present in LIVE_SYSTEM_CONTEXT.
            Do not infer, invent, or reveal values that are absent from the authorized context.
            Do not claim that you performed an action or accessed any data beyond LIVE_SYSTEM_CONTEXT.
            Never request or reveal passwords, API keys, JWT tokens, bank credentials, or identity numbers.
            Answer in the same language as the user's latest message.
            Keep answers concise, practical, and under 250 words unless more detail is necessary.
            """;

    private final GeminiProperties properties;
    private final RestClient geminiRestClient;

    public String generateReply(
            List<ChatHistoryMessageRequest> history,
            String message,
            String liveSystemContext
    ) {
        if (!properties.isReady()) {
            throw new ServiceUnavailableException("AI assistant is not configured");
        }

        String systemInstruction = SYSTEM_INSTRUCTION
                + System.lineSeparator()
                + "LIVE_SYSTEM_CONTEXT:"
                + System.lineSeparator()
                + liveSystemContext;

        GeminiGenerateContentRequest request = new GeminiGenerateContentRequest(
                new GeminiContent(List.of(new GeminiPart(systemInstruction)), null),
                buildContents(history, message),
                new GeminiGenerationConfig(0.3, 512)
        );

        try {
            JsonNode response = geminiRestClient.post()
                    .uri("/v1beta/models/{model}:generateContent", properties.getModel().trim())
                    .header("x-goog-api-key", properties.getApiKey().trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);

            return extractReply(response);
        } catch (RestClientResponseException | ResourceAccessException exception) {
            throw new ServiceUnavailableException("AI assistant is temporarily unavailable");
        }
    }

    private List<GeminiContent> buildContents(List<ChatHistoryMessageRequest> history, String message) {
        List<GeminiContent> contents = new ArrayList<>();
        List<ChatHistoryMessageRequest> limitedHistory = limitHistory(history);

        for (ChatHistoryMessageRequest historyMessage : limitedHistory) {
            String geminiRole = "assistant".equals(historyMessage.getRole()) ? "model" : "user";
            contents.add(new GeminiContent(
                    List.of(new GeminiPart(historyMessage.getContent().trim())),
                    geminiRole
            ));
        }

        contents.add(new GeminiContent(List.of(new GeminiPart(message.trim())), "user"));
        return contents;
    }

    private List<ChatHistoryMessageRequest> limitHistory(List<ChatHistoryMessageRequest> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        int limit = Math.max(0, properties.getMaxHistoryMessages());
        if (limit == 0) {
            return List.of();
        }

        int fromIndex = Math.max(0, history.size() - limit);
        return history.subList(fromIndex, history.size());
    }

    private String extractReply(JsonNode response) {
        JsonNode textNode = response == null
                ? null
                : response.at("/candidates/0/content/parts/0/text");

        if (textNode == null || textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new ServiceUnavailableException("AI assistant returned an empty response");
        }

        return textNode.asText().trim();
    }

    private record GeminiGenerateContentRequest(
            GeminiContent systemInstruction,
            List<GeminiContent> contents,
            GeminiGenerationConfig generationConfig
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiContent(List<GeminiPart> parts, String role) {
    }

    private record GeminiPart(String text) {
    }

    private record GeminiGenerationConfig(double temperature, int maxOutputTokens) {
    }
}
