package com.tropilot.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Getter
@Setter
public class UtilityReadingUpdateRequest {

    @NotNull(message = "Room is required")
    private Long roomId;

    @NotBlank(message = "Reading month is required")
    @Pattern(
            regexp = "^\\d{4}-(0[1-9]|1[0-2])$",
            message = "Reading month must use YYYY-MM format"
    )
    private String month;

    @NotNull(message = "Old electricity reading is required")
    @DecimalMin(value = "0.00", message = "Old electricity reading must be greater than or equal to 0")
    private BigDecimal oldElectricity;

    @NotNull(message = "New electricity reading is required")
    @DecimalMin(value = "0.00", message = "New electricity reading must be greater than or equal to 0")
    private BigDecimal newElectricity;

    @NotNull(message = "Old water reading is required")
    @DecimalMin(value = "0.00", message = "Old water reading must be greater than or equal to 0")
    private BigDecimal oldWater;

    @NotNull(message = "New water reading is required")
    @DecimalMin(value = "0.00", message = "New water reading must be greater than or equal to 0")
    private BigDecimal newWater;

    @NotBlank(message = "Edit reason is required")
    @Size(max = 1000, message = "Edit reason must not exceed 1000 characters")
    private String editReason;

    private MultipartFile electricityImage;

    private MultipartFile waterImage;
}
