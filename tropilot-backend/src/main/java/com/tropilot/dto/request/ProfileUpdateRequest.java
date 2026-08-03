package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/** Các thông tin cơ bản mà người dùng được phép tự sửa trong hồ sơ của mình. */
public class ProfileUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9+()\\-\\s]{0,30}$", message = "Phone number is invalid")
    private String phone;
}
