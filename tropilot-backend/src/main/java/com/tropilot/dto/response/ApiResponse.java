package com.tropilot.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
/** Vỏ bọc chung của API: success, thông báo, dữ liệu và chi tiết lỗi xác thực nếu có. */
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private List<?> errors;

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message) {
        return success(message, null);
    }

    public static <T> ApiResponse<T> failure(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(List.of())
                .build();
    }

    public static <T> ApiResponse<T> failure(String message, List<?> errors) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errors(errors == null ? List.of() : errors)
                .build();
    }
}
