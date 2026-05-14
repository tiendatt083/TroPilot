package com.tropilot.dto.response;

import com.tropilot.enums.InvoiceStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class InvoiceResponse {

    private Long id;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long residentHeadId;
    private String residentHeadName;
    private String residentHeadEmail;
    private String month;
    private BigDecimal totalAmount;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private String electricityImageUrl;
    private String waterImageUrl;
    private List<InvoiceItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
