package com.tropilot.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BuildingUpsertRequest {

    @NotBlank(message = "Building code is required")
    @Size(max = 50, message = "Building code must not exceed 50 characters")
    private String buildingCode;

    @NotBlank(message = "Building name is required")
    @Size(max = 160, message = "Building name must not exceed 160 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @NotNull(message = "Floors is required")
    @Min(value = 1, message = "Floors must be greater than or equal to 1")
    private Integer floors;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}
