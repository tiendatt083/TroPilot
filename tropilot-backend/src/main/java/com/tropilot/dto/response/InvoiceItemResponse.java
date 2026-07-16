package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class InvoiceItemResponse {

    private Long id;
    private Long serviceFeeId;
    private String itemName;
    private String calculationType;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal amount;
    private String note;
}
