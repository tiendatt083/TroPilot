package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InvoiceComplaintRequest {

    @NotBlank(message = "Complaint title is required")
    @Size(max = 160, message = "Complaint title must not exceed 160 characters")
    private String title;

    @NotBlank(message = "Complaint content is required")
    @Size(max = 2000, message = "Complaint content must not exceed 2000 characters")
    private String content;
}
