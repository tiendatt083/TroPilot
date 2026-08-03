package com.tropilot.security;

import com.tropilot.exception.UnauthorizedException;

/**
 * Tiện ích kiểm tra đối tượng người dùng đã xác thực trước khi dùng id của họ.
 */
public final class AuthenticatedUsers {

    /** Constructor riêng để lớp tiện ích này không thể được khởi tạo. */
    private AuthenticatedUsers() {
    }

    /** Trả về id người dùng đã đăng nhập; ném lỗi 401 nếu chưa xác thực. */
    public static Long requireUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }
        return user.getId();
    }
}
