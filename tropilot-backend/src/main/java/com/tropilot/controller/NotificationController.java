package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.NotificationResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
/**
 * API để người dùng xem và đánh dấu đã đọc các thông báo thuộc về chính họ.
 */
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    // Chỉ lấy thông báo theo userId từ JWT, không nhận userId do client gửi lên.
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Notifications loaded successfully",
                notificationService.getMyNotifications(requireUserId(user))
        );
    }

    @PutMapping("/{id}/read")
    // Đánh dấu một thông báo là đã đọc sau khi service xác nhận nó thuộc người dùng hiện tại.
    public ApiResponse<NotificationResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success("Notification marked as read successfully", notificationService.markRead(requireUserId(user), id));
    }
}
