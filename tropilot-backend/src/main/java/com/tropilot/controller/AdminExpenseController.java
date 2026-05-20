package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ApiResponse<List<ExpenseResponse>> getExpenses(@RequestParam(required = false) Long buildingId) {
        return ApiResponse.success("Expenses loaded successfully", expenseService.getExpenses(buildingId));
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<ExpenseResponse> cancelExpense(
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success("Expense cancelled successfully", expenseService.cancelExpense(id, buildingId));
    }
}
