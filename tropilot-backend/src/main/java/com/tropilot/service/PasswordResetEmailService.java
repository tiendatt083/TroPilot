package com.tropilot.service;

import com.tropilot.entity.User;

import java.time.LocalDateTime;

/** Hợp đồng gửi email chứa mã xác nhận đặt lại mật khẩu. */
public interface PasswordResetEmailService {

    void sendPasswordResetCodeEmail(User user, String code, LocalDateTime expiresAt);
}
