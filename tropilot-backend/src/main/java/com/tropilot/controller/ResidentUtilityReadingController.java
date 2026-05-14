package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.UtilityReadingResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
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
public class ResidentUtilityReadingController {

    private final UtilityReadingService utilityReadingService;

    @GetMapping("/current-room")
    public ApiResponse<List<UtilityReadingResponse>> getCurrentRoomReadings(
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return ApiResponse.success(
                "Utility readings loaded successfully",
                utilityReadingService.getCurrentResidentRoomReadings(getUserId(user))
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
