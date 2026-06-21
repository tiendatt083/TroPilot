package com.tropilot.service;

import com.tropilot.entity.User;

import java.time.LocalDateTime;

public interface PasswordResetEmailService {

    void sendPasswordResetCodeEmail(User user, String code, LocalDateTime expiresAt);
}
