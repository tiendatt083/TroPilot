package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
/** Dữ liệu tính thử một hóa đơn trước khi ADMIN quyết định tạo bản ghi chính thức. */
public class InvoicePreviewRequest {

    @NotNull(message = "Room is required")
    private Long roomId;

    @NotNull(message = "Invoice date is required")
    private LocalDate invoiceDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @DecimalMin(value = "0.00", message = "Additional charge must not be negative")
    private BigDecimal additionalChargeAmount;

    @Size(max = 255, message = "Additional charge note must not exceed 255 characters")
    private String additionalChargeNote;
}
