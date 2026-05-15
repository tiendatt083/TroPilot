package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackStatusUpdateRequest {

    @NotBlank(message = "Feedback status is required")
    @Size(max = 30, message = "Feedback status must not exceed 30 characters")
    private String status;
}
