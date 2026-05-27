package com.tropilot.dto.response;

import com.tropilot.enums.NotificationTargetType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String content;
    private NotificationTargetType targetType;
    private Long targetId;
    private List<Long> targetUserIds;
    private List<String> targetUserNames;
    private boolean allBuildings;
    private List<Long> buildingIds;
    private List<String> buildingNames;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private boolean read;
    private LocalDateTime readAt;
}
