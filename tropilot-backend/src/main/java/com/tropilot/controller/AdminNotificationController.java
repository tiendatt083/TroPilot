package com.tropilot.controller;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API gửi và theo dõi thông báo do ADMIN tạo.
 * POST / tạo/gửi thông báo; GET / xem thông báo nhận được theo bộ lọc;
 * GET /sent xem các thông báo mà ADMIN đã gửi.
 */
public class AdminNotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ApiResponse<NotificationResponse> createNotification(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @Valid @RequestBody NotificationCreateRequest request
    ) {
        return ApiResponse.success(
                "Notification created successfully",
                notificationService.createNotification(request, requireUserId(user), buildingId)
        );
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getNotifications(
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Notifications loaded successfully",
                notificationService.getAdminNotifications(buildingId)
        );
    }

    @GetMapping("/sent")
    public ApiResponse<List<NotificationResponse>> getSentNotifications(
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Sent notifications loaded successfully",
                notificationService.getAdminNotifications(buildingId)
        );
    }
}
