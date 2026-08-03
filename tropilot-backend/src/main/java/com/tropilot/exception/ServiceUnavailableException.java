package com.tropilot.exception;

import org.springframework.http.HttpStatus;

/** Lỗi 503: dịch vụ phụ thuộc bên ngoài hiện chưa thể phục vụ request. */
public class ServiceUnavailableException extends BusinessException {

    public ServiceUnavailableException(String message) {
        super(message, HttpStatus.SERVICE_UNAVAILABLE);
    }
}
