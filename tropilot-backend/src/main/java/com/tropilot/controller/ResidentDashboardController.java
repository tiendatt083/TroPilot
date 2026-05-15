package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
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
@RequestMapping("/api/resident/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<ResidentDashboardResponse> getDashboard(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return ApiResponse.success("Resident dashboard loaded successfully", dashboardService.getResidentDashboard(user.getId()));
    }
}
