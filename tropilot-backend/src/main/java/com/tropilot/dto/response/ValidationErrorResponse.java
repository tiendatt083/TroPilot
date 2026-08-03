package com.tropilot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
/** Một lỗi dữ liệu đầu vào: field cho biết trường lỗi, message mô tả điều kiện không đạt. */
public class ValidationErrorResponse {

    private String field;
    private String message;
}
