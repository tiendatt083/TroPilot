package com.tropilot.exception;

import org.springframework.http.HttpStatus;

/** Lỗi 400: request có dữ liệu hoặc thao tác không hợp lệ theo quy tắc nghiệp vụ. */
public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
