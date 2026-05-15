package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.StaffDashboardResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<StaffDashboardResponse> getDashboard(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return ApiResponse.success("Staff dashboard loaded successfully", dashboardService.getStaffDashboard(user.getId()));
    }
}
