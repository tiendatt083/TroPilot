package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class CashFlowResponse {

    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal remainingCash;
    private BigDecimal unpaidAmount;
    private String month;
    private List<ReceiptResponse> receipts;
    private List<ExpenseResponse> expenses;
}
