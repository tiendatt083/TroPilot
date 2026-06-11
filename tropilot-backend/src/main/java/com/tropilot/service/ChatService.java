package com.tropilot.service;

import com.tropilot.dto.request.ChatMessageRequest;
import com.tropilot.dto.response.ChatMessageResponse;

public interface ChatService {

    ChatMessageResponse reply(ChatMessageRequest request);
}
