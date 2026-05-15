package com.tropilot.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskRejectRequest {

    @Size(max = 2000, message = "Result note must not exceed 2000 characters")
    private String resultNote;
}
