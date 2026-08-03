package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
/** Một khoản tiền trong hóa đơn: tên phí, cách tính, số lượng, đơn giá và thành tiền. */
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
