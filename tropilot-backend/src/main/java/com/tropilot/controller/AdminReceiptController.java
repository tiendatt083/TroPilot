package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ReceiptResponse;
import com.tropilot.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/receipts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API chỉ đọc các phiếu thu.
 * GET / trả về toàn bộ phiếu thu hoặc chỉ các phiếu thuộc buildingId mà ADMIN chọn.
 */
public class AdminReceiptController {

    private final ReceiptService receiptService;

    @GetMapping
    public ApiResponse<List<ReceiptResponse>> getReceipts(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Receipts loaded successfully", receiptService.getReceipts(buildingId));
    }
}
