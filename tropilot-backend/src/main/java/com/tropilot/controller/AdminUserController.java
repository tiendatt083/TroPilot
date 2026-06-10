package com.tropilot.controller;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.request.AdminUpdateUserRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.PasswordResetResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/{id}")
    public ApiResponse<UserResponse> getUser(@PathVariable Long id) {
        return ApiResponse.success("User loaded successfully", userService.getUser(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest request
    ) {
        return ApiResponse.success("User updated successfully", userService.updateUser(id, request));
    }

    @PutMapping("/{id}/lock")
    public ApiResponse<UserResponse> lockUser(@PathVariable Long id) {
        return ApiResponse.success("User locked successfully", userService.lockUser(id));
    }

    @PutMapping("/{id}/unlock")
    public ApiResponse<UserResponse> unlockUser(@PathVariable Long id) {
        return ApiResponse.success("User unlocked successfully", userService.unlockUser(id));
    }

    @PutMapping("/{id}/reset-password")
    public ApiResponse<PasswordResetResponse> resetPassword(@PathVariable Long id) {
        return ApiResponse.success("Temporary password generated successfully", userService.resetPassword(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ApiResponse.success("User deleted successfully");
    }

}
