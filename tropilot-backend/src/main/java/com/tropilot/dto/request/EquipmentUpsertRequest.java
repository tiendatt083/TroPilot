package com.tropilot.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
/** Dữ liệu tạo/sửa thiết bị: phạm vi dùng chung hay trong phòng, số lượng và lịch bảo trì. */
public class EquipmentUpsertRequest {

    @Size(max = 60, message = "Equipment code must not exceed 60 characters")
    private String equipmentCode;

    @NotBlank(message = "Equipment name is required")
    @Size(max = 160, message = "Equipment name must not exceed 160 characters")
    private String name;

    @NotBlank(message = "Equipment scope is required")
    @Size(max = 20, message = "Equipment scope must not exceed 20 characters")
    private String scope;

    private Long roomId;

    @NotNull(message = "Equipment quantity is required")
    @Min(value = 1, message = "Equipment quantity must be at least 1")
    private Integer quantity;

    @Size(max = 120, message = "Equipment brand must not exceed 120 characters")
    private String brand;

    @Size(max = 120, message = "Equipment model must not exceed 120 characters")
    private String model;

    @Size(max = 255, message = "Equipment location must not exceed 255 characters")
    private String locationDescription;

    private LocalDate addedDate;

    private LocalDate installationDate;

    private LocalDate lastMaintenanceDate;

    private LocalDate nextMaintenanceDate;

    @NotBlank(message = "Equipment condition is required")
    @Size(max = 30, message = "Equipment condition must not exceed 30 characters")
    private String condition;

    @Size(max = 1200, message = "Equipment note must not exceed 1200 characters")
    private String note;
}
