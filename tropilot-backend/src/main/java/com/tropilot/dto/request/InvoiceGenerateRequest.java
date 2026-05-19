package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class InvoiceGenerateRequest {

    private Long buildingId;

    @NotNull(message = "Room is required")
    private Long roomId;

    @NotBlank(message = "Invoice month is required")
    @Pattern(
            regexp = "^\\d{4}-(0[1-9]|1[0-2])$",
            message = "Invoice month must use YYYY-MM format"
    )
    private String month;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;
}
