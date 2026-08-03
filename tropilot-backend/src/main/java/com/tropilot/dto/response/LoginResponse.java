package com.tropilot.dto.response;

import com.tropilot.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
/** Kết quả đăng nhập: JWT, thông tin nhận diện, vai trò và cờ bắt buộc đổi mật khẩu. */
public class LoginResponse {

    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private UserRole role;
    private boolean mustChangePassword;
}
