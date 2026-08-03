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
/**
 * Điểm nhận tin nhắn từ widget chatbot và trả về câu trả lời do ChatService tạo ra.
 */
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/messages")
    // Kiểm tra dữ liệu tin nhắn trước khi chuyển cho service xử lý ngữ cảnh và gọi AI.
    public ApiResponse<ChatMessageResponse> sendMessage(@Valid @RequestBody ChatMessageRequest request) {
        return ApiResponse.success("AI assistant reply generated successfully", chatService.reply(request));
    }
}
