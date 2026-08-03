package com.tropilot.service;

import com.tropilot.dto.request.SepayWebhookRequest;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;

import java.util.Optional;

/** Hợp đồng tạo giao dịch QR SePay, tìm giao dịch và xử lý webhook ngân hàng. */
public interface SepayPaymentService {

    Optional<SepayPayment> createForInvoice(Invoice invoice);

    Optional<SepayPayment> findByInvoiceId(Long invoiceId);

    void handleWebhook(SepayWebhookRequest request, String authorizationHeader);
}
