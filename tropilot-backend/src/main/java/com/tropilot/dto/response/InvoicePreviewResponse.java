package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class InvoicePreviewResponse {

    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private LocalDate invoiceDate;
    private String invoiceMonth;
    private String utilityMonth;
    private LocalDate dueDate;
    private boolean firstInvoiceForCurrentHead;
    private boolean depositIncluded;
    private boolean utilityReadingRequired;
    private BigDecimal totalAmount;
    private List<InvoiceItemResponse> items;
    private List<String> warnings;
}
