package com.tropilot.service;

import com.tropilot.dto.response.ReceiptResponse;

import java.util.List;

public interface ReceiptService {

    List<ReceiptResponse> getReceipts();

    ReceiptResponse getReceipt(Long id);
}
