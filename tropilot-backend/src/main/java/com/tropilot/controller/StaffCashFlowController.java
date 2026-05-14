package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.CashFlowResponse;
import com.tropilot.service.CashFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/staff/cashflow")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffCashFlowController {

    private final CashFlowService cashFlowService;

    @GetMapping
    public ApiResponse<CashFlowResponse> getCashFlow(@RequestParam(required = false) String month) {
        return ApiResponse.success("Cash flow loaded successfully", cashFlowService.getCashFlow(month));
    }
}
