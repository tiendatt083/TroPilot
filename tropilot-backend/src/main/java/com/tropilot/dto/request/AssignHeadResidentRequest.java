package com.tropilot.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class AssignHeadResidentRequest {

    @NotNull(message = "Head resident is required")
    private Long residentHeadId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.00", message = "Deposit amount must be greater than or equal to 0")
    private BigDecimal depositAmount;
}
