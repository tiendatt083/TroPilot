package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
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
/**
 * API hợp đồng dành cho trưởng phòng, chỉ làm việc với hợp đồng của phòng mình.
 * GET /current xem hợp đồng hiện hành; PUT /{id}/confirm xác nhận;
 * POST /{id}/report-error báo thông tin hợp đồng có sai sót để quản lý xử lý.
 */
public class ResidentContractController {

    private final RentalContractService rentalContractService;

    @GetMapping("/current")
    public ApiResponse<RentalContractResponse> getCurrentContract(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(
                "Current rental contract loaded successfully",
                rentalContractService.getCurrentResidentContract(requireUserId(user))
        );
    }

    @PutMapping("/{id}/confirm")
    public ApiResponse<RentalContractResponse> confirmContract(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Rental contract confirmed successfully",
                rentalContractService.confirmResidentContract(requireUserId(user), id)
        );
    }

    @PostMapping("/{id}/report-error")
    public ApiResponse<RentalContractResponse> reportContractIssue(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success(
                "Rental contract issue reported successfully",
                rentalContractService.reportResidentContractIssue(requireUserId(user), id)
        );
    }
}
