package com.tropilot.service;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;

import java.time.LocalDateTime;

/** Hợp đồng gửi email thông báo phát hành hóa đơn và thanh toán thành công. */
public interface PaymentEmailService {

    void sendInvoiceIssuedEmail(Invoice invoice, SepayPayment payment);

    void sendPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt);
}
