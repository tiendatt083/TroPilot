package com.tropilot.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
/** Exception gốc cho lỗi nghiệp vụ, luôn đi kèm HTTP status để handler trả response đúng mã. */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
