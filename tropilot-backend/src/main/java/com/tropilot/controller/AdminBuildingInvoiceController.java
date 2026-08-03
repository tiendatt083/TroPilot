package com.tropilot.controller;

import com.tropilot.dto.request.BulkInvoiceRequest;
import com.tropilot.dto.request.InvoicePreviewRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.BulkInvoicePreviewResponse;
import com.tropilot.dto.response.InvoicePreviewResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/buildings/{buildingId}/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API hóa đơn của một tòa nhà, chỉ ADMIN được dùng.
 * GET / và /{invoiceId} để xem; POST /preview để tính thử một hóa đơn trước khi lưu;
 * POST /generate để tạo; POST /bulk-preview và /bulk-generate để xử lý nhiều phòng;
 * DELETE /{invoiceId} để xóa hóa đơn theo quy tắc nghiệp vụ.
 */
public class AdminBuildingInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<List<InvoiceResponse>> getInvoices(@PathVariable(name = "buildingId") Long buildingId) {
        return ApiResponse.success(
                "Invoices loaded successfully",
                invoiceService.getBuildingInvoices(buildingId)
        );
    }

    @GetMapping("/{invoiceId}")
    public ApiResponse<InvoiceResponse> getInvoice(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "invoiceId") Long invoiceId
    ) {
        return ApiResponse.success(
                "Invoice loaded successfully",
                invoiceService.getBuildingInvoice(buildingId, invoiceId)
        );
    }

    @PostMapping("/preview")
    public ApiResponse<InvoicePreviewResponse> previewInvoice(
            @PathVariable(name = "buildingId") Long buildingId,
            @Valid @RequestBody InvoicePreviewRequest request
    ) {
        return ApiResponse.success(
                "Invoice preview loaded successfully",
                invoiceService.previewBuildingInvoice(buildingId, request)
        );
    }

    @PostMapping("/generate")
    public ApiResponse<InvoiceResponse> generateInvoice(
            @PathVariable(name = "buildingId") Long buildingId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody InvoicePreviewRequest request
    ) {
        return ApiResponse.success(
                "Invoice generated successfully",
                invoiceService.generateBuildingInvoice(buildingId, request, requireUserId(user))
        );
    }

    @PostMapping("/bulk-preview")
    public ApiResponse<BulkInvoicePreviewResponse> previewBulkInvoices(
            @PathVariable(name = "buildingId") Long buildingId,
            @Valid @RequestBody BulkInvoiceRequest request
    ) {
        return ApiResponse.success(
                "Bulk invoice preview loaded successfully",
                invoiceService.previewBuildingInvoices(buildingId, request)
        );
    }

    @PostMapping("/bulk-generate")
    public ApiResponse<List<InvoiceResponse>> generateBulkInvoices(
            @PathVariable(name = "buildingId") Long buildingId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody BulkInvoiceRequest request
    ) {
        return ApiResponse.success(
                "Bulk invoices generated successfully",
                invoiceService.generateBuildingInvoices(buildingId, request, requireUserId(user))
        );
    }

    @DeleteMapping("/{invoiceId}")
    public ApiResponse<Void> deleteInvoice(
            @PathVariable(name = "buildingId") Long buildingId,
            @PathVariable(name = "invoiceId") Long invoiceId,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        invoiceService.deleteBuildingInvoice(buildingId, invoiceId, requireUserId(user));
        return ApiResponse.success("Invoice deleted successfully");
    }
}
