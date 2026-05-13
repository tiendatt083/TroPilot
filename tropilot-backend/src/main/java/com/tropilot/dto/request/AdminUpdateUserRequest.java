package com.tropilot.dto.request;

import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateUserRequest {

    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @Email(message = "Email must be valid")
    @Size(max = 160, message = "Email must not exceed 160 characters")
    private String email;

    @Pattern(regexp = "^[0-9+()\\-\\s]{0,30}$", message = "Phone number is invalid")
    private String phone;

    private UserRole role;

    private UserStatus status;
}
