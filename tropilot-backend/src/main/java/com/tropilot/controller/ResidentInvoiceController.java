package com.tropilot.controller;

import com.tropilot.dto.request.InvoiceComplaintRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.FeedbackService;
import com.tropilot.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/resident/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RESIDENT_HEAD')")
public class ResidentInvoiceController {

    private final InvoiceService invoiceService;
    private final FeedbackService feedbackService;

    @GetMapping
    public ApiResponse<List<InvoiceResponse>> getInvoices(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Invoices loaded successfully", invoiceService.getResidentInvoices(getUserId(user)));
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceResponse> getInvoice(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success("Invoice loaded successfully", invoiceService.getResidentInvoice(getUserId(user), id));
    }

    @PostMapping("/{id}/complaint")
    public ApiResponse<FeedbackResponse> createComplaint(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody InvoiceComplaintRequest request
    ) {
        return ApiResponse.success(
                "Invoice complaint submitted successfully",
                feedbackService.createInvoiceComplaint(getUserId(user), id, request)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
