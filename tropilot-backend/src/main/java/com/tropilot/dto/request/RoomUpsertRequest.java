package com.tropilot.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class RoomUpsertRequest {

    @NotNull(message = "Building is required")
    private Long buildingId;

    @NotBlank(message = "Room code is required")
    @Size(max = 50, message = "Room code must not exceed 50 characters")
    private String roomCode;

    @NotBlank(message = "Room name is required")
    @Size(max = 160, message = "Room name must not exceed 160 characters")
    private String roomName;

    @NotNull(message = "Floor is required")
    @Min(value = 1, message = "Floor must be greater than or equal to 1")
    private Integer floor;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be greater than or equal to 0")
    private BigDecimal price;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "0.00", message = "Area must be greater than or equal to 0")
    private BigDecimal area;

    @NotNull(message = "Maximum occupants is required")
    @Min(value = 1, message = "Maximum occupants must be greater than or equal to 1")
    private Integer maxOccupants;

    @NotBlank(message = "Room status is required")
    @Size(max = 30, message = "Room status must not exceed 30 characters")
    private String status;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;
}
