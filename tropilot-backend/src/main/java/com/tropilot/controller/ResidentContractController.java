package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.RentalContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resident/contracts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentContractController {

    private final RentalContractService rentalContractService;

    @GetMapping("/current")
    public ApiResponse<RentalContractResponse> getCurrentContract(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Current rental contract loaded successfully",
                rentalContractService.getCurrentResidentContract(getUserId(user))
        );
    }

    @PutMapping("/{id}/confirm")
    public ApiResponse<RentalContractResponse> confirmContract(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Rental contract confirmed successfully",
                rentalContractService.confirmResidentContract(getUserId(user), id)
        );
    }

    @PostMapping("/{id}/report-error")
    public ApiResponse<RentalContractResponse> reportContractIssue(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Rental contract issue reported successfully",
                rentalContractService.reportResidentContractIssue(getUserId(user), id)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
