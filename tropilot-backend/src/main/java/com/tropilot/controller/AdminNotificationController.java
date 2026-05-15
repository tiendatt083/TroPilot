package com.tropilot.controller;

import com.tropilot.dto.request.NotificationCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ApiResponse<NotificationResponse> createNotification(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody NotificationCreateRequest request
    ) {
        return ApiResponse.success(
                "Notification created successfully",
                notificationService.createNotification(request, getUserId(user))
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
