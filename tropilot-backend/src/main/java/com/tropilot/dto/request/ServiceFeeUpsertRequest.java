package com.tropilot.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
/** Dữ liệu tạo/sửa một loại phí: giá, cách tính và loại xe nếu đó là phí gửi xe. */
public class ServiceFeeUpsertRequest {

    @NotBlank(message = "Service fee name is required")
    @Size(max = 120, message = "Service fee name must not exceed 120 characters")
    private String name;

    @NotBlank(message = "Fee type is required")
    @Size(max = 30, message = "Fee type must not exceed 30 characters")
    private String feeType;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be greater than or equal to 0")
    private BigDecimal unitPrice;

    @NotBlank(message = "Calculation type is required")
    @Size(max = 30, message = "Calculation type must not exceed 30 characters")
    private String calculationType;

    @Size(max = 30, message = "Vehicle type must not exceed 30 characters")
    private String vehicleType;
}
