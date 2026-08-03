package com.tropilot.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
/** Dữ liệu ADMIN cập nhật thông tin liên hệ chung: email, địa chỉ, giờ làm và các số điện thoại. */
public class SystemContactUpdateRequest {

    @NotBlank(message = "Contact email is required")
    @Email(message = "Contact email is invalid")
    @Size(max = 160, message = "Contact email must not exceed 160 characters")
    private String email;

    @NotBlank(message = "Office address is required")
    @Size(max = 255, message = "Office address must not exceed 255 characters")
    private String officeAddress;

    @NotNull(message = "Working start time is required")
    private LocalTime workingStartTime;

    @NotNull(message = "Working end time is required")
    private LocalTime workingEndTime;

    @Valid
    @NotEmpty(message = "At least one phone number is required")
    @Size(max = 20, message = "No more than 20 phone numbers are allowed")
    private List<ContactPhoneRequest> phones;
}
