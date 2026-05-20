package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/receipts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReceiptController {

    private final ReceiptService receiptService;

    @GetMapping
    public ApiResponse<List<ReceiptResponse>> getReceipts(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Receipts loaded successfully", receiptService.getReceipts(buildingId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ReceiptResponse> getReceipt(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Receipt loaded successfully", receiptService.getReceipt(id, buildingId));
    }
}
