package com.tropilot.service.impl;

import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.User;
import com.tropilot.util.TemporaryPasswordCipher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final TemporaryPasswordCipher temporaryPasswordCipher;

    public UserResponse toResponse(User user) {
        return toResponse(user, false);
    }

    public UserResponse toAdminResponse(User user) {
        return toResponse(user, true);
    }

    private UserResponse toResponse(User user, boolean includeTemporaryPassword) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .mustChangePassword(user.isMustChangePassword())
                .temporaryPassword(resolveTemporaryPassword(user, includeTemporaryPassword))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String resolveTemporaryPassword(User user, boolean includeTemporaryPassword) {
        if (!includeTemporaryPassword || !user.isMustChangePassword()) {
            return null;
        }

        String encryptedPassword = user.getTemporaryPasswordEncrypted();
        if (encryptedPassword == null || encryptedPassword.isBlank()) {
            return null;
        }

        return temporaryPasswordCipher.decrypt(encryptedPassword);
    }
}
