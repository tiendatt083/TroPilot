package com.rentalhub.backend.dto;

import com.rentalhub.backend.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String fullName;
    private String emailOrPhone;
    private UserRole role;
}
