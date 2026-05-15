package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class MaintenanceCompleteRequest {

    @NotBlank(message = "Result note is required when completing a maintenance request")
    @Size(max = 2000, message = "Result note must not exceed 2000 characters")
    private String resultNote;

    private MultipartFile resultImage;
}
