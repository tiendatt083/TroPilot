package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class MaintenanceRequestCreateRequest {

    @NotBlank(message = "Maintenance request title is required")
    @Size(max = 160, message = "Maintenance request title must not exceed 160 characters")
    private String title;

    @NotBlank(message = "Maintenance request content is required")
    @Size(max = 2000, message = "Maintenance request content must not exceed 2000 characters")
    private String content;

    @Positive(message = "Assigned staff id must be positive")
    private Long assignedToId;

    private MultipartFile image;
}
