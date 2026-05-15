package com.tropilot.dto.response;

import com.tropilot.enums.UserRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ActivityLogResponse {

    private Long id;
    private Long userId;
    private String userFullName;
    private String userEmail;
    private UserRole userRole;
    private String action;
    private String description;
    private LocalDateTime createdAt;
}
