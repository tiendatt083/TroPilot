package com.tropilot.exception;

import org.springframework.http.HttpStatus;

/** Lỗi 401: chưa đăng nhập hoặc thông tin xác thực không hợp lệ. */
public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
