package com.tropilot.dto.response;

import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.PaymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
/** Minh chứng thanh toán hóa đơn, gồm ảnh, trạng thái xác nhận và người đã xác nhận. */
public class PaymentResponse {

    private Long id;
    private Long invoiceId;
    private String invoiceMonth;
    private BigDecimal invoiceTotalAmount;
    private InvoiceStatus invoiceStatus;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private String proofImageUrl;
    private PaymentStatus status;
    private LocalDateTime uploadedAt;
    private Long confirmedById;
    private String confirmedByName;
    private String confirmedByRole;
    private LocalDateTime confirmedAt;
    private String note;
}
