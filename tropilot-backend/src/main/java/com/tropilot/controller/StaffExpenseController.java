package com.tropilot.controller;

import com.tropilot.dto.request.ExpenseCreateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.ExpenseResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
public class StaffExpenseController {

    private final ExpenseService expenseService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ExpenseResponse> createExpense(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @ModelAttribute ExpenseCreateRequest request
    ) {
        return ApiResponse.success("Expense created successfully", expenseService.createExpense(request, getUserId(user)));
    }

    @GetMapping
    public ApiResponse<List<ExpenseResponse>> getExpenses(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Expenses loaded successfully", expenseService.getExpenses(buildingId));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
