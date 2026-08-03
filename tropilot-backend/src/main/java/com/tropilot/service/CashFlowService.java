package com.tropilot.service;

import com.tropilot.dto.response.CashFlowResponse;

/** Hợp đồng tổng hợp dòng tiền và công nợ theo tháng, có thể lọc theo tòa nhà. */
public interface CashFlowService {

    CashFlowResponse getCashFlow(String month, Long buildingId);
}
