package com.tropilot.service;

import com.tropilot.dto.request.SepayWebhookRequest;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;

import java.util.Optional;

public interface SepayPaymentService {

    Optional<SepayPayment> createForInvoice(Invoice invoice);

    Optional<SepayPayment> findByInvoiceId(Long invoiceId);

    SepayPayment handleWebhook(SepayWebhookRequest request, String authorizationHeader);
}
