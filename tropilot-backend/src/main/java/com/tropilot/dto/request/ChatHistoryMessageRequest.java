package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatHistoryMessageRequest {

    @NotBlank(message = "Chat message role is required")
    @Pattern(regexp = "user|assistant", message = "Chat message role must be user or assistant")
    private String role;

    @NotBlank(message = "Chat message content is required")
    @Size(max = 2000, message = "Chat message content must not exceed 2000 characters")
    private String content;
}
