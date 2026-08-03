package com.tropilot.controller;

import com.tropilot.dto.request.PaymentUploadRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.PaymentResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resident/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
/**
 * API gửi minh chứng thanh toán hóa đơn.
 * POST /upload nhận multipart/form-data (dữ liệu thanh toán và có thể có ảnh), sau đó
 * service kiểm tra hóa đơn thuộc phòng của trưởng phòng trước khi lưu.
 */
public class ResidentPaymentController {

    private final PaymentService paymentService;

    @PostMapping(path = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<PaymentResponse> uploadPaymentProof(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @ModelAttribute PaymentUploadRequest request
    ) {
        return ApiResponse.success(
                "Payment proof uploaded successfully",
                paymentService.uploadPaymentProof(requireUserId(user), request)
        );
    }
}
