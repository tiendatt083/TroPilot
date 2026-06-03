package com.tropilot.service;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.User;

import java.time.LocalDateTime;

public interface ReceiptCreationService {

    Receipt createValidReceipt(Invoice invoice, User createdBy, LocalDateTime createdAt);
}
