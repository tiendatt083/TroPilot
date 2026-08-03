package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
/**
 * API xem các khoản thanh toán đang chờ xác nhận, dành cho STAFF và ADMIN.
 * GET /pending có thể nhận buildingId để giới hạn danh sách cần kiểm tra.
 */
public class StaffPaymentController {

    private final PaymentService paymentService;

    @GetMapping("/pending")
    public ApiResponse<List<PaymentResponse>> getPendingPayments(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Pending payments loaded successfully", paymentService.getPendingPayments(buildingId));
    }
}
