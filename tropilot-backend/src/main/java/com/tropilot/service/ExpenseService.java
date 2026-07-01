package com.tropilot.service;

import com.tropilot.dto.request.ExpenseCreateRequest;
import com.tropilot.dto.response.ExpenseResponse;

import java.util.List;

public interface ExpenseService {

    ExpenseResponse createExpense(ExpenseCreateRequest request, Long createdById);

    List<ExpenseResponse> getExpenses(Long buildingId);

    ExpenseResponse approveExpense(Long id, Long approvedById, Long buildingId);

    ExpenseResponse cancelExpense(Long id, Long cancelledById, Long buildingId);
}
