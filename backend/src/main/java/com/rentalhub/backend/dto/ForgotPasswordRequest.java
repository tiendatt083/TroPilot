package com.rentalhub.backend.dto;

import com.rentalhub.backend.model.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Email is required")
    private String email;

    @NotNull(message = "Role is required")
    private UserRole role;
}
