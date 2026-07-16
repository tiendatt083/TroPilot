package com.tropilot.integration.gemini;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.tropilot.config.GeminiProperties;
import com.tropilot.dto.request.ChatHistoryMessageRequest;
import com.tropilot.exception.ServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class GeminiChatClient {

    private static final Logger LOGGER = LoggerFactory.getLogger(GeminiChatClient.class);

    private static final int MAX_OUTPUT_TOKENS = 1500;
    private static final double TEMPERATURE = 0.3;

    private static final String SYSTEM_INSTRUCTION = """
            You are the Tropilot Assistant for a rental property operations management system.
            Answer only questions about using Tropilot and general rental property operations covered by Tropilot,
            including buildings, rooms, residents, contracts, utilities, invoices, payments, vehicles, maintenance,
            expenses, tasks, notifications, feedback, dashboards, and equipment.
            If a question is outside this scope, politely state that you can only help with Tropilot.

            A LIVE_SYSTEM_CONTEXT JSON object may be supplied with authorized, current Tropilot data.
            Treat values in LIVE_SYSTEM_CONTEXT as authoritative. Answer direct factual questions from it directly.
            Use exact numbers, dates, statuses, names, and amounts from LIVE_SYSTEM_CONTEXT when they are present.
            Use LIVE_SYSTEM_CONTEXT.businessRules when explaining Tropilot workflows, restrictions, and role permissions.
            Respect LIVE_SYSTEM_CONTEXT.user.dataScope and role boundaries. If the user asks for data outside that scope,
            state that the requested data is not available in the authorized context.
            Do not redirect the user to another page or tell them to inspect the UI when the requested answer exists in LIVE_SYSTEM_CONTEXT.
            Do not infer, invent, or reveal values that are absent from the authorized context.
            If the context does not contain enough data to answer, clearly say which data is missing.
            Do not claim that you performed an action or accessed any data beyond LIVE_SYSTEM_CONTEXT.
            Never request or reveal passwords, API keys, JWT tokens, or bank credentials.

            For count, summary, and overview questions, never return only the total when the related records are
            available in LIVE_SYSTEM_CONTEXT. State the total first, then provide a compact list of the relevant
            records with their most useful available details. For building questions, list each building by code and
            name, then include available room occupancy figures and one or two operational details such as missing
            utility readings, unpaid invoices, or pending maintenance. If there are more than 10 relevant records,
            list the first 10 and state how many additional records exist. Never invent missing details.

            When useful, explain the cause behind a result and suggest the next operational action.
            Preferred response format for analytical questions:
            1. Main result
            2. Related details
            3. Notes or warnings
            4. Suggested actions
            Use this structure only when the question needs deeper analysis. For simple factual questions, answer
            concisely but still include the related record list required by the count and summary rule above.
            Answer in the same language as the user's latest message. If the latest message is Vietnamese, answer in Vietnamese.
            If the latest message is English, answer in English.
            Use plain text only. Do not use Markdown, asterisks, bold markers, tables, or bullet symbols.
            Write compact paragraphs or short plain lines when listing details.
            Keep answers practical and focused. Do not add unsupported assumptions.
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
                new GeminiGenerationConfig(TEMPERATURE, MAX_OUTPUT_TOKENS)
        );

        List<String> models = resolveModels();
        ServiceUnavailableException lastFailure = null;

        for (int index = 0; index < models.size(); index++) {
            String model = models.get(index);
            boolean hasFallback = index < models.size() - 1;

            try {
                JsonNode response = geminiRestClient.post()
                        .uri("/v1beta/models/{model}:generateContent", model)
                        .header("x-goog-api-key", properties.getApiKey().trim())
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(JsonNode.class);

                return extractReply(response);
            } catch (RestClientResponseException exception) {
                lastFailure = new ServiceUnavailableException("AI assistant is temporarily unavailable");
                logGeminiHttpFailure(model, exception, hasFallback);

                if (!shouldTryFallback(exception, hasFallback)) {
                    throw lastFailure;
                }
            } catch (ResourceAccessException exception) {
                lastFailure = new ServiceUnavailableException("AI assistant is temporarily unavailable");
                LOGGER.warn(
                        "Gemini request failed for model {} because the service could not be reached. fallbackAvailable={}",
                        model,
                        hasFallback
                );

                if (!hasFallback) {
                    throw lastFailure;
                }
            } catch (ServiceUnavailableException exception) {
                lastFailure = exception;
                LOGGER.warn(
                        "Gemini returned an unusable response for model {}. fallbackAvailable={}",
                        model,
                        hasFallback
                );

                if (!hasFallback) {
                    throw lastFailure;
                }
            }
        }

        throw lastFailure == null
                ? new ServiceUnavailableException("AI assistant is temporarily unavailable")
                : lastFailure;
    }

    private List<String> resolveModels() {
        Set<String> models = new LinkedHashSet<>();
        addModel(models, properties.getModel());

        if (properties.getFallbackModels() != null) {
            properties.getFallbackModels().forEach(model -> addModel(models, model));
        }

        return List.copyOf(models);
    }

    private void addModel(Set<String> models, String model) {
        if (model != null && !model.isBlank()) {
            models.add(model.trim());
        }
    }

    private void logGeminiHttpFailure(
            String model,
            RestClientResponseException exception,
            boolean hasFallback
    ) {
        LOGGER.warn(
                "Gemini request failed for model {} with status {}. fallbackAvailable={}",
                model,
                exception.getStatusCode().value(),
                hasFallback
        );
    }

    private boolean shouldTryFallback(RestClientResponseException exception, boolean hasFallback) {
        if (!hasFallback) {
            return false;
        }

        int statusCode = exception.getStatusCode().value();
        return statusCode == 404 || statusCode == 429 || statusCode >= 500;
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
