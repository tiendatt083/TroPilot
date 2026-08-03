package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
/** Một số điện thoại liên hệ, gồm nhãn hiển thị và số thực tế. */
public class ContactPhoneRequest {

    @NotBlank(message = "Phone display name is required")
    @Size(max = 100, message = "Phone display name must not exceed 100 characters")
    private String displayName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9+()\\-\\s]{6,30}$", message = "Phone number is invalid")
    private String phoneNumber;
}
