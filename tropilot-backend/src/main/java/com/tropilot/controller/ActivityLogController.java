package com.tropilot.controller;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/me")
    public ApiResponse<List<ActivityLogResponse>> getMyLogs(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "query", required = false) String query,
            @RequestParam(name = "action", required = false) String action
    ) {
        Long userId = requireUserId(user);

        return ApiResponse.success(
                "Activity logs loaded successfully",
                activityLogService.getMyLogs(userId, resolveQuery(query, action))
        );
    }

    private String resolveQuery(String query, String legacyAction) {
        return query == null || query.isBlank() ? legacyAction : query;
    }
}
