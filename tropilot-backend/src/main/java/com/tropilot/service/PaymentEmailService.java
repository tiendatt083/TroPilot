package com.tropilot.service;

import com.tropilot.entity.Invoice;

import java.time.LocalDateTime;

public interface PaymentEmailService {

    void sendPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt);
}
