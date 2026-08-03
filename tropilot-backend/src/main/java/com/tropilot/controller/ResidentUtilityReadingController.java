package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.UtilityReadingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/utility-readings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API chỉ đọc chỉ số điện, nước của phòng hiện tại.
 * GET /current-room trả danh sách kỳ ghi chỉ số sau khi kiểm tra quyền từ tài khoản đăng nhập.
 */
public class ResidentUtilityReadingController {

    private final UtilityReadingService utilityReadingService;

    @GetMapping("/current-room")
    public ApiResponse<List<UtilityReadingResponse>> getCurrentRoomReadings(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Utility readings loaded successfully",
                utilityReadingService.getCurrentResidentRoomReadings(requireUserId(user))
        );
    }
}
