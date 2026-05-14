package com.tropilot.service;

import com.tropilot.dto.response.CashFlowResponse;

public interface CashFlowService {

    CashFlowResponse getCashFlow(String month);
}
