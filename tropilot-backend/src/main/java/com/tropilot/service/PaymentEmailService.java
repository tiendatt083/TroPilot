package com.tropilot.service;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;

import java.time.LocalDateTime;

public interface PaymentEmailService {

    void sendInvoiceIssuedEmail(Invoice invoice, SepayPayment payment);

    void sendPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt);
}
