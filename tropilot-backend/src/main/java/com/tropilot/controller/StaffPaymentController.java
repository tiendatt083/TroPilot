package com.tropilot.controller;

import com.tropilot.dto.request.PaymentDecisionRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/pending")
    public ApiResponse<List<PaymentResponse>> getPendingPayments(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Pending payments loaded successfully", paymentService.getPendingPayments(buildingId));
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<PaymentResponse> approvePayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId,
            @Valid @RequestBody(required = false) PaymentDecisionRequest request
    ) {
        return ApiResponse.success(
                "Payment approved successfully",
                paymentService.approvePayment(id, getUserId(user), request, buildingId)
        );
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<PaymentResponse> rejectPayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId,
            @Valid @RequestBody(required = false) PaymentDecisionRequest request
    ) {
        return ApiResponse.success(
                "Payment rejected successfully",
                paymentService.rejectPayment(id, getUserId(user), request, buildingId)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
