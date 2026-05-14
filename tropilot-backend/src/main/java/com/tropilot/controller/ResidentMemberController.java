package com.tropilot.controller;

import com.tropilot.dto.request.RoomMemberRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RoomMemberResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
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
public class ResidentMemberController {

    private final RoomMemberService roomMemberService;

    @PostMapping
    public ApiResponse<RoomMemberResponse> createMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody RoomMemberRequest request
    ) {
        return ApiResponse.success(
                "Room member submitted for approval successfully",
                roomMemberService.createResidentMember(getUserId(user), request)
        );
    }

    @GetMapping
    public ApiResponse<List<RoomMemberResponse>> getMembers(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Room members loaded successfully",
                roomMemberService.getResidentMembers(getUserId(user))
        );
    }

    @PutMapping("/{id}")
    public ApiResponse<RoomMemberResponse> updateMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @Valid @RequestBody RoomMemberRequest request
    ) {
        return ApiResponse.success(
                "Room member updated successfully",
                roomMemberService.updateResidentMember(getUserId(user), id, request)
        );
    }

    @PutMapping("/{id}/leave")
    public ApiResponse<RoomMemberResponse> markMemberLeft(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id
    ) {
        return ApiResponse.success(
                "Room member marked as left successfully",
                roomMemberService.markResidentMemberLeft(getUserId(user), id)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
