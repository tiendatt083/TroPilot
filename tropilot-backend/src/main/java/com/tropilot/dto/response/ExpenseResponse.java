package com.tropilot.dto.response;

import com.tropilot.enums.ExpenseStatus;
import com.tropilot.enums.ExpenseType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ExpenseResponse {

    private Long id;
    private String expenseCode;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long taskId;
    private Long maintenanceRequestId;
    private BigDecimal amount;
    private String content;
    private ExpenseType expenseType;
    private String proofImageUrl;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private ExpenseStatus status;
}
