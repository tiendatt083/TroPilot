package com.tropilot.service.impl;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ChatMessageResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.integration.gemini.GeminiChatClient;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ChatContextService;
import com.tropilot.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final CurrentUserProvider currentUserProvider;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final ChatContextService chatContextService;
    private final GeminiChatClient geminiChatClient;

    @Override
    public ChatMessageResponse reply(ChatMessageRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();
        validateAccess(currentUser);

        String liveContext = chatContextService.buildContext(currentUser);
        String reply = geminiChatClient.generateReply(
                request.getHistory(),
                request.getMessage(),
                liveContext
        );
        return new ChatMessageResponse(reply);
    }

    private void validateAccess(User user) {
        if (user.getRole() != UserRole.RESIDENT_HEAD) {
            return;
        }

        boolean hasActiveRoom = roomAssignmentRepository.existsByResidentHead_IdAndStatus(
                user.getId(),
                RoomAssignmentStatus.ACTIVE
        );

        if (!hasActiveRoom) {
            throw new ForbiddenException("Head Resident must have an active room to use the AI assistant");
        }
    }
}
