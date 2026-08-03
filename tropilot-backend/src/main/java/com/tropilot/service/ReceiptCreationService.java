package com.tropilot.service;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.User;

import java.time.LocalDateTime;

/** Hợp đồng tạo biên lai hợp lệ từ hóa đơn đã thanh toán. */
public interface ReceiptCreationService {

    Receipt createValidReceipt(Invoice invoice, User createdBy, LocalDateTime createdAt);
}
