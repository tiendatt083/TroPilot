package com.tropilot.service;

import com.tropilot.dto.response.ReceiptResponse;

import java.util.List;

/** Hợp đồng tra cứu danh sách biên lai trong phạm vi tòa nhà. */
public interface ReceiptService {

    List<ReceiptResponse> getReceipts(Long buildingId);
}
