package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MaintenanceAssignRequest {

    @NotNull(message = "Assigned staff is required")
    private Long assignedToId;
}
