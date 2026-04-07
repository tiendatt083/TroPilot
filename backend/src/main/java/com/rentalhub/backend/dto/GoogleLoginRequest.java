package com.rentalhub.backend.dto;

import com.rentalhub.backend.model.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "Google Credential is required")
    private String credential;

    @NotNull(message = "Role is required")
    private UserRole role;
}
