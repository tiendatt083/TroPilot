package com.tropilot.controller;

import com.tropilot.dto.request.BulkInvoiceRequest;
import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.BulkInvoicePreviewResponse;
import com.tropilot.dto.response.InvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/buildings/{buildingId}/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffBuildingInvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/preview")
    public ApiResponse<InvoicePreviewResponse> previewInvoice(
            @PathVariable Long buildingId,
            @Valid @RequestBody InvoicePreviewRequest request
    ) {
        return ApiResponse.success(
                "Invoice preview loaded successfully",
                invoiceService.previewBuildingInvoice(buildingId, request)
        );
    }

    @PostMapping("/generate")
    public ApiResponse<InvoiceResponse> generateInvoice(
            @PathVariable Long buildingId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody InvoicePreviewRequest request
    ) {
        return ApiResponse.success(
                "Invoice generated successfully",
                invoiceService.generateBuildingInvoice(buildingId, request, getUserId(user))
        );
    }

    @PostMapping("/bulk-preview")
    public ApiResponse<BulkInvoicePreviewResponse> previewBulkInvoices(
            @PathVariable Long buildingId,
            @Valid @RequestBody BulkInvoiceRequest request
    ) {
        return ApiResponse.success(
                "Bulk invoice preview loaded successfully",
                invoiceService.previewBuildingInvoices(buildingId, request)
        );
    }

    @PostMapping("/bulk-generate")
    public ApiResponse<List<InvoiceResponse>> generateBulkInvoices(
            @PathVariable Long buildingId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody BulkInvoiceRequest request
    ) {
        return ApiResponse.success(
                "Bulk invoices generated successfully",
                invoiceService.generateBuildingInvoices(buildingId, request, getUserId(user))
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
