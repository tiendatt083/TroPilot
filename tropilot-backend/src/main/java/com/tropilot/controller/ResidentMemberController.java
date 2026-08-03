package com.tropilot.controller;

import com.tropilot.dto.request.RoomMemberUpsertRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.RoomMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/members")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API quản lý thành viên phòng của trưởng phòng.
 * POST / thêm người; GET / xem danh sách; PUT /{id} sửa thông tin; PUT /{id}/leave
 * đánh dấu một thành viên đã rời phòng thay vì xóa mất lịch sử.
 */
public class ResidentMemberController {

    private final RoomMemberService roomMemberService;

    @PostMapping
    public ApiResponse<RoomMemberResponse> createMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody RoomMemberUpsertRequest request
    ) {
        return ApiResponse.success(
                "Room member submitted for approval successfully",
                roomMemberService.createResidentMember(requireUserId(user), request)
        );
    }

    @GetMapping
    public ApiResponse<List<RoomMemberResponse>> getMembers(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Room members loaded successfully",
                roomMemberService.getResidentMembers(requireUserId(user))
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<RoomMemberResponse> updateMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody RoomMemberUpsertRequest request
    ) {
        return ApiResponse.success(
                "Room member updated successfully",
                roomMemberService.updateResidentMember(requireUserId(user), id, request)
        );
    }

    @PutMapping("/{id}/leave")
    public ApiResponse<RoomMemberResponse> markMemberLeft(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Room member marked as left successfully",
                roomMemberService.markResidentMemberLeft(requireUserId(user), id)
        );
    }
}
