package com.tropilot.exception;

import org.springframework.http.HttpStatus;

/** Lỗi 404: không tìm thấy bản ghi hoặc tài nguyên được yêu cầu. */
public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
