package com.tropilot.service.impl;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ChatMessageResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.integration.gemini.GeminiChatClient;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.ResidentRoomAccessService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra dịch vụ chat chỉ gửi ngữ cảnh hợp lệ và chặn chủ hộ chưa có phòng ACTIVE. */
class ChatServiceImplTest {

    @Mock
    private CurrentUserProvider currentUserProvider;

    @Mock
    private ResidentRoomAccessService residentRoomAccessService;

    @Mock
    private ChatContextService chatContextService;

    @Mock
    private GeminiChatClient geminiChatClient;

    @Test
    void replyPassesAuthorizedLiveContextToGemini() {
        ChatServiceImpl service = new ChatServiceImpl(
                currentUserProvider,
                residentRoomAccessService,
                chatContextService,
                geminiChatClient
        );
        User admin = User.builder()
                .id(1L)
                .role(UserRole.ADMIN)
                .build();
        ChatMessageRequest request = new ChatMessageRequest();
        request.setMessage("How many buildings are there?");
        String context = "{\"user\":{\"role\":\"ADMIN\",\"dataScope\":\"GLOBAL_ADMIN\"},"
                + "\"summary\":{\"totalBuildings\":4}}";

        when(currentUserProvider.getCurrentUser()).thenReturn(admin);
        when(chatContextService.buildContext(admin, request.getMessage())).thenReturn(context);
        when(geminiChatClient.generateReply(request.getHistory(), request.getMessage(), context))
                .thenReturn("There are 4 buildings.");

        ChatMessageResponse response = service.reply(request);

        assertThat(response.getReply()).isEqualTo("There are 4 buildings.");
        verify(chatContextService).buildContext(admin, request.getMessage());
        verify(geminiChatClient).generateReply(request.getHistory(), request.getMessage(), context);
    }

    @Test
    void replyRequiresActiveRoomForResidentHead() {
        ChatServiceImpl service = new ChatServiceImpl(
                currentUserProvider,
                residentRoomAccessService,
                chatContextService,
                geminiChatClient
        );
        User resident = User.builder()
                .id(7L)
                .role(UserRole.RESIDENT_HEAD)
                .build();
        ChatMessageRequest request = new ChatMessageRequest();
        request.setMessage("Show my room details");

        when(currentUserProvider.getCurrentUser()).thenReturn(resident);
        when(chatContextService.buildContext(resident, request.getMessage())).thenReturn("{}");
        when(geminiChatClient.generateReply(request.getHistory(), request.getMessage(), "{}"))
                .thenReturn("Room details");

        service.reply(request);

        verify(residentRoomAccessService).requireActiveAssignment(resident.getId());
    }

    @Test
    void replyBlocksResidentWithoutActiveRoomBeforeBuildingContext() {
        ChatServiceImpl service = new ChatServiceImpl(
                currentUserProvider,
                residentRoomAccessService,
                chatContextService,
                geminiChatClient
        );
        User resident = User.builder()
                .id(8L)
                .role(UserRole.RESIDENT_HEAD)
                .build();
        ChatMessageRequest request = new ChatMessageRequest();
        request.setMessage("Show my latest invoice");

        when(currentUserProvider.getCurrentUser()).thenReturn(resident);
        when(residentRoomAccessService.requireActiveAssignment(resident.getId()))
                .thenThrow(new ForbiddenException("An active room assignment is required to use resident features"));

        assertThatThrownBy(() -> service.reply(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("active room assignment");

        verifyNoInteractions(chatContextService, geminiChatClient);
    }
}
