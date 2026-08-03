package com.tropilot.controller;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
/**
 * API quản lý tài khoản người dùng.
 * POST / tạo tài khoản; GET / xem toàn bộ tài khoản; DELETE /{id} xóa tài khoản
 * sau khi service kiểm tra các dữ liệu đang phụ thuộc vào tài khoản đó.
 */
public class AdminUserController {

    private final UserService userService;

    @PostMapping
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ApiResponse.success("User created successfully", userService.createUser(request));
    }

    @GetMapping
    public ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.success("Users loaded successfully", userService.getUsers());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable(name = "id") Long id) {
        userService.deleteUser(id);
        return ApiResponse.success("User deleted successfully");
    }

}
