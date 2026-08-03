package com.tropilot.dto.response;

import com.tropilot.enums.ReceiptStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
/** Phiếu thu sinh từ hóa đơn, gồm số tiền, mã phiếu, phòng và người tạo. */
public class ReceiptResponse {

    private Long id;
    private String receiptCode;
    private Long invoiceId;
    private String invoiceMonth;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private BigDecimal amount;
    private String content;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private ReceiptStatus status;
}
