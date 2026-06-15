package com.tropilot.integration.gemini;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChatbotQuestionScopeDocumentTest {

    private static final Path QUESTION_SCOPE_DOCUMENT =
            Path.of("..", "docs", "chatbot-question-scope.md");

    private static final List<String> REQUIRED_CHECKLIST_IDS = List.of(
            "CHAT-ADMIN-001",
            "CHAT-ADMIN-002",
            "CHAT-ADMIN-003",
            "CHAT-ADMIN-004",
            "CHAT-ADMIN-005",
            "CHAT-ADMIN-006",
            "CHAT-ADMIN-007",
            "CHAT-ADMIN-008",
            "CHAT-STAFF-001",
            "CHAT-STAFF-002",
            "CHAT-STAFF-003",
            "CHAT-STAFF-004",
            "CHAT-RESIDENT-001",
            "CHAT-RESIDENT-002",
            "CHAT-RESIDENT-003",
            "CHAT-RESIDENT-004",
            "CHAT-RESIDENT-005",
            "CHAT-PERM-001",
            "CHAT-PERM-002",
            "CHAT-PERM-003",
            "CHAT-PERM-004",
            "CHAT-FAIL-001",
            "CHAT-FAIL-002"
    );

    @Test
    void questionScopeDocumentContainsQualityAndPermissionChecklist() throws IOException {
        String document = Files.readString(QUESTION_SCOPE_DOCUMENT);
        String normalizedDocument = document.replaceAll("\\s+", " ");

        REQUIRED_CHECKLIST_IDS.forEach(id -> assertThat(document).contains(id));
        assertThat(normalizedDocument)
                .contains("Use only current data supplied by the authorized Tropilot context")
                .contains("Never invent counts, names, statuses, dates, amounts")
                .contains("Use the language of the user's latest message")
                .contains("Respect role permissions and the active-room restriction")
                .contains("Never expose passwords, temporary passwords, tokens, secrets")
                .contains("The chatbot states that the current context is insufficient")
                .contains("The chatbot states that it can only assist with Tropilot");
    }
}
