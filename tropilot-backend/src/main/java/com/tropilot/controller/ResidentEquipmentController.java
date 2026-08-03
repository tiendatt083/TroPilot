package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/equipment")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API thiết bị của phòng hiện tại.
 * GET /current-room tự xác định phòng từ tài khoản đăng nhập, vì vậy client không thể
 * truyền roomId của phòng khác để xem dữ liệu thiết bị.
 */
public class ResidentEquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping("/current-room")
    public ApiResponse<List<EquipmentResponse>> getCurrentRoomEquipment(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Equipment loaded successfully",
                equipmentService.getResidentEquipment(requireUserId(user))
        );
    }
}
