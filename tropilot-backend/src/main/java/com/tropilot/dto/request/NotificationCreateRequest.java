package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationCreateRequest {

    @NotBlank(message = "Notification title is required")
    @Size(max = 160, message = "Notification title must not exceed 160 characters")
    private String title;

    @NotBlank(message = "Notification content is required")
    @Size(max = 2000, message = "Notification content must not exceed 2000 characters")
    private String content;

    @NotBlank(message = "Notification target type is required")
    @Size(max = 40, message = "Notification target type must not exceed 40 characters")
    private String targetType;

    private Long targetId;
}
