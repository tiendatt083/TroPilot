package com.rentalhub.backend.dto;

import com.rentalhub.backend.model.UserRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Email is required")
    private String email;

    @NotNull(message = "Role is required")
    private UserRole role;

    @NotBlank(message = "OTP is required")
    private String otp;

    @NotBlank(message = "New Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String newPassword;
}
