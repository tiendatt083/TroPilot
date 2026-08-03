package com.tropilot.service;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ChatMessageResponse;

/** Hợp đồng tiếp nhận tin nhắn và tạo câu trả lời từ trợ lý chat. */
public interface ChatService {

    ChatMessageResponse reply(ChatMessageRequest request);
}
