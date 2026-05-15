package com.tropilot.controller;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/my")
    public ApiResponse<List<ActivityLogResponse>> getMyLogs(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String action
    ) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return ApiResponse.success("Activity logs loaded successfully", activityLogService.getMyLogs(user.getId(), action));
    }
}
