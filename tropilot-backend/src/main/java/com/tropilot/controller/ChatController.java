package com.tropilot.controller;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ChatMessageResponse;
import com.tropilot.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success("AI assistant reply generated successfully", chatService.reply(request));
    }
}
