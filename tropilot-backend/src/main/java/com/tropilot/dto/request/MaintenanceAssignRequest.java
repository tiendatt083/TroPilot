package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/** ID nhân viên mà ADMIN phân công xử lý một yêu cầu bảo trì. */
public class MaintenanceAssignRequest {

    @NotNull(message = "Assigned staff is required")
    private Long assignedToId;
}
