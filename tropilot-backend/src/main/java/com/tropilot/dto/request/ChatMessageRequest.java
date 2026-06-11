package com.tropilot.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class ChatMessageRequest {

    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message must not exceed 2000 characters")
    private String message;

    @Valid
    @Size(max = 8, message = "Chat history must not exceed 8 messages")
    private List<ChatHistoryMessageRequest> history = new ArrayList<>();
}
