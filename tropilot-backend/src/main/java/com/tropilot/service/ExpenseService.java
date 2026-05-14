package com.tropilot.service;

import com.tropilot.dto.request.ExpenseRequest;
import com.tropilot.dto.response.ExpenseResponse;

import java.util.List;

public interface ExpenseService {

    ExpenseResponse createExpense(ExpenseRequest request, Long createdById);

    List<ExpenseResponse> getExpenses();

    ExpenseResponse cancelExpense(Long id);
}
