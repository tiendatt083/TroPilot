package com.tropilot.controller;

import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API dữ liệu tổng quan cho màn hình dashboard ADMIN.
 * GET / gom các số liệu quản trị cần hiển thị thay vì frontend phải gọi nhiều API nhỏ.
 */
public class AdminDashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ApiResponse<AdminDashboardResponse> getDashboard() {
        return ApiResponse.success("Admin dashboard loaded successfully", dashboardService.getAdminDashboard());
    }
}
