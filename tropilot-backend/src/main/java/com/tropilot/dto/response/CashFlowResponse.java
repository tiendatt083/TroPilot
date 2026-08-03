package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
/** Tổng quan dòng tiền tháng và các phiếu thu tạo nên số liệu đó. */
public class CashFlowResponse {

    private BigDecimal totalIncome;
    private BigDecimal remainingCash;
    private BigDecimal unpaidAmount;
    private String month;
    private List<ReceiptResponse> receipts;
}
