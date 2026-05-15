package com.tropilot.controller;

import com.tropilot.dto.response.ActivityLogResponse;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/activity-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ApiResponse<List<ActivityLogResponse>> getLogs(@RequestParam(required = false) String action) {
        return ApiResponse.success("Activity logs loaded successfully", activityLogService.getLogs(action));
    }
}
