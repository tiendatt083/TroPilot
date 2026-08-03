package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.HeadResidentAssignmentResponse;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.HeadResidentAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;

@RestController
@RequestMapping("/api/resident")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API tra cứu phòng hiện tại của trưởng phòng.
 * GET /room là endpoint nền tảng để frontend biết roomId trước khi hiển thị các màn hình liên quan.
 */
public class ResidentRoomController {

    private final HeadResidentAssignmentService headResidentAssignmentService;

    @GetMapping("/room")
    public ApiResponse<HeadResidentAssignmentResponse> getAssignedRoom(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Assigned room loaded successfully",
                headResidentAssignmentService.getResidentAssignedRoom(requireUserId(user))
        );
    }
}
