package com.tropilot.mapper;

import com.tropilot.dto.response.SepayPaymentResponse;
import com.tropilot.entity.SepayPayment;
import org.springframework.stereotype.Component;

@Component
public class SepayPaymentMapper {

    public SepayPaymentResponse toResponse(SepayPayment payment) {
        if (payment == null) {
            return null;
        }

        return SepayPaymentResponse.builder()
                .id(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .amount(payment.getAmount())
                .bankCode(payment.getBankCode())
                .accountNumber(payment.getAccountNumber())
                .accountName(payment.getAccountName())
                .qrImageUrl(payment.getQrImageUrl())
                .status(payment.getStatus())
                .paidAmount(payment.getPaidAmount())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
