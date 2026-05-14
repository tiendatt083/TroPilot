package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.InvoiceResponse;
import com.tropilot.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/invoices")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ApiResponse<List<InvoiceResponse>> getInvoices() {
        return ApiResponse.success("Invoices loaded successfully", invoiceService.getInvoices());
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceResponse> getInvoice(@PathVariable Long id) {
        return ApiResponse.success("Invoice loaded successfully", invoiceService.getInvoice(id));
    }
}
