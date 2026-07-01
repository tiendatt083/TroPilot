package com.tropilot.controller;

import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Expense cancelled successfully",
                expenseService.cancelExpense(id, getUserId(user), buildingId)
        );
    }

    @PutMapping("/{id}/approve")
    public ApiResponse<ExpenseResponse> approveExpense(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long id,
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success(
                "Expense approved successfully",
                expenseService.approveExpense(id, getUserId(user), buildingId)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }
        return user.getId();
    }
}
