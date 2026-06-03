package com.tropilot.dto.response;

import com.tropilot.enums.SepayPaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SepayPaymentResponse {

    private Long id;
    private String paymentCode;
    private BigDecimal amount;
    private String bankCode;
    private String accountNumber;
    private String accountName;
    private String qrImageUrl;
    private SepayPaymentStatus status;
    private BigDecimal paidAmount;
    private LocalDateTime paidAt;
}
