package com.tropilot.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Getter
@Setter
public class ExpenseCreateRequest {

    private Long roomId;

    @Positive(message = "Task reference must be greater than zero")
    private Long taskId;

    @Positive(message = "Maintenance request reference must be greater than zero")
    private Long maintenanceRequestId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Expense content is required")
    @Size(max = 1000, message = "Expense content must not exceed 1000 characters")
    private String content;

    @NotBlank(message = "Expense type is required")
    @Size(max = 30, message = "Expense type must not exceed 30 characters")
    private String expenseType;

    private MultipartFile proofImage;
}
