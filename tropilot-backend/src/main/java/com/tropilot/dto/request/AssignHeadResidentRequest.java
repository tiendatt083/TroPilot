package com.tropilot.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
/** Dữ liệu phân công một cư dân làm trưởng phòng trong khoảng thời gian xác định. */
public class AssignHeadResidentRequest {

    @NotNull(message = "Head resident is required")
    private Long residentHeadId;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    @NotNull(message = "End date is required")
    private LocalDate endDate;

}
