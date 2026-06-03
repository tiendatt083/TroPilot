package com.tropilot.service.impl;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.Receipt;
import com.tropilot.entity.User;
import com.tropilot.enums.ReceiptStatus;
import com.tropilot.service.ReceiptCreationService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class ReceiptCreationServiceImpl implements ReceiptCreationService {

    private static final DateTimeFormatter RECEIPT_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

    @Override
    public Receipt createValidReceipt(Invoice invoice, User createdBy, LocalDateTime createdAt) {
        String content = "Payment receipt for invoice " + invoice.getId()
                + ", room " + invoice.getRoom().getRoomCode()
                + ", month " + invoice.getMonth().format(MONTH_FORMATTER);

        return Receipt.builder()
                .receiptCode(generateReceiptCode(createdAt))
                .invoice(invoice)
                .room(invoice.getRoom())
                .residentHead(invoice.getResidentHead())
                .amount(invoice.getTotalAmount())
                .content(content)
                .createdBy(createdBy)
                .createdAt(createdAt)
                .status(ReceiptStatus.VALID)
                .build();
    }

    private String generateReceiptCode(LocalDateTime createdAt) {
        return "RCT-" + createdAt.format(RECEIPT_DATE_FORMATTER) + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
