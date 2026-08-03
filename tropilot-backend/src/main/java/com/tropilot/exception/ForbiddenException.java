package com.tropilot.exception;

import org.springframework.http.HttpStatus;

/** Lỗi 403: người dùng đã xác thực nhưng không có quyền thực hiện thao tác. */
public class ForbiddenException extends BusinessException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
