package com.tropilot.controller;

import com.tropilot.dto.request.InvoiceGenerateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffInvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/generate")
    public ApiResponse<InvoiceResponse> generateInvoice(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody InvoiceGenerateRequest request
    ) {
        return ApiResponse.success(
                "Invoice generated successfully",
                invoiceService.generateInvoice(request, getUserId(user))
        );
    }

    @GetMapping
    public ApiResponse<List<InvoiceResponse>> getInvoices(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Invoices loaded successfully", invoiceService.getInvoices(buildingId));
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceResponse> getInvoice(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Invoice loaded successfully", invoiceService.getInvoice(id, buildingId));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
