package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProfileUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9+()\\-\\s]{0,30}$", message = "Phone number is invalid")
    private String phone;

    @Size(max = 60, message = "Citizen ID must not exceed 60 characters")
    private String identityNumber;
}
