package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeedbackCreateRequest {

    @NotBlank(message = "Feedback type is required")
    @Size(max = 40, message = "Feedback type must not exceed 40 characters")
    private String type;

    @NotBlank(message = "Feedback title is required")
    @Size(max = 160, message = "Feedback title must not exceed 160 characters")
    private String title;

    @NotBlank(message = "Feedback content is required")
    @Size(max = 2000, message = "Feedback content must not exceed 2000 characters")
    private String content;
}
