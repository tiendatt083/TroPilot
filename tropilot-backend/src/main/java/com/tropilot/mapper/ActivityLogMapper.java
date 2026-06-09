package com.tropilot.mapper;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.entity.ActivityLog;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ActivityLogMapper {

    public ActivityLogResponse toResponse(ActivityLog log) {
        User user = log.getUser();

        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .userRole(user.getRole())
                .action(log.getAction())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
