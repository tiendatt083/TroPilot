package com.tropilot.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class BulkInvoicePreviewResponse {

    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private LocalDate invoiceDate;
    private String invoiceMonth;
    private String utilityMonth;
    private LocalDate dueDate;
    private int eligibleCount;
    private int blockedCount;
    private BigDecimal totalAmount;
    private List<InvoicePreviewResponse> eligibleInvoices;
    private List<InvoiceBulkBlockedRoomResponse> blockedRooms;
}
