package com.tropilot.service.impl;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ChatMessageResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.integration.gemini.GeminiChatClient;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ChatContextService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private ChatContextService chatContextService;

    @Mock
    private GeminiChatClient geminiChatClient;

    @Test
    void replyPassesAuthorizedLiveContextToGemini() {
        ChatServiceImpl service = new ChatServiceImpl(
                currentUserProvider,
                roomAssignmentRepository,
                chatContextService,
                geminiChatClient
        );
        User admin = User.builder()
                .id(1L)
                .role(UserRole.ADMIN)
                .build();
        ChatMessageRequest request = new ChatMessageRequest();
        request.setMessage("How many buildings are there?");
        String context = "{\"metrics\":{\"totalBuildings\":4}}";

        when(currentUserProvider.getCurrentUser()).thenReturn(admin);
        when(chatContextService.buildContext(admin)).thenReturn(context);
        when(geminiChatClient.generateReply(request.getHistory(), request.getMessage(), context))
                .thenReturn("There are 4 buildings.");

        ChatMessageResponse response = service.reply(request);

        assertThat(response.getReply()).isEqualTo("There are 4 buildings.");
        verify(chatContextService).buildContext(admin);
        verify(geminiChatClient).generateReply(request.getHistory(), request.getMessage(), context);
    }
}
