package com.tropilot.dto.response;

import com.tropilot.enums.NotificationTargetType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String content;
    private NotificationTargetType targetType;
    private Long targetId;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private boolean read;
    private LocalDateTime readAt;
}
