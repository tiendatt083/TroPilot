package com.tropilot.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class RoomMemberUpsertRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must not exceed 120 characters")
    private String fullName;

    @NotBlank(message = "Phone is required")
    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @NotBlank(message = "Email is required")
    @Email(message = "Email format is invalid")
    @Size(max = 120, message = "Email must not exceed 120 characters")
    private String email;

    private LocalDate dateOfBirth;

    @NotBlank(message = "Relationship is required")
    @Size(max = 80, message = "Relationship must not exceed 80 characters")
    private String relationship;

    @NotNull(message = "Move-in date is required")
    private LocalDate moveInDate;

    @Size(max = 1000, message = "Note must not exceed 1000 characters")
    private String note;
}
