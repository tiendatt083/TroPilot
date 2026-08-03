package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.MaintenanceRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/maintenance-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API chỉ đọc tiến độ các yêu cầu bảo trì của phòng hiện tại.
 * GET / dùng userId trong JWT để trả đúng các yêu cầu liên quan, không nhận roomId từ client.
 */
public class ResidentMaintenanceRequestController {

    private final MaintenanceRequestService maintenanceRequestService;

    @GetMapping
    public ApiResponse<List<MaintenanceRequestResponse>> getRequests(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Maintenance requests loaded successfully",
                maintenanceRequestService.getResidentRequests(requireUserId(user))
        );
    }
}
