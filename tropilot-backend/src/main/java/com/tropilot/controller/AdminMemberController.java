package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.RoomMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberController {

    private final RoomMemberService roomMemberService;

    @GetMapping("/members/pending")
    public ApiResponse<List<RoomMemberResponse>> getPendingMembers(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Pending room members loaded successfully", roomMemberService.getPendingMembers(buildingId));
    }

    @GetMapping("/members")
    public ApiResponse<List<RoomMemberResponse>> getBuildingMembers(@RequestParam(name = "buildingId") Long buildingId) {
        return ApiResponse.success("Room members loaded successfully", roomMemberService.getBuildingMembers(buildingId));
    }

    @GetMapping("/rooms/{roomId}/members")
    public ApiResponse<List<RoomMemberResponse>> getRoomMembers(@PathVariable(name = "roomId") Long roomId) {
        return ApiResponse.success("Room members loaded successfully", roomMemberService.getRoomMembers(roomId));
    }

    @PutMapping("/members/{id}/approve")
    public ApiResponse<RoomMemberResponse> approveMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Room member approved successfully",
                roomMemberService.approveMember(id, requireUserId(user), buildingId)
        );
    }

    @PutMapping("/members/{id}/reject")
    public ApiResponse<RoomMemberResponse> rejectMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Room member rejected successfully",
                roomMemberService.rejectMember(id, requireUserId(user), buildingId)
        );
    }
}
