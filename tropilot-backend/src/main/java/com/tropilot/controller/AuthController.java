package com.tropilot.controller;

import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.ForgotPasswordRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.request.ProfileUpdateRequest;
import com.tropilot.dto.request.ResetPasswordWithCodeRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login completed successfully", authService.login(request));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordResetCode(request);
        return ApiResponse.success("If the email exists, a verification code has been sent");
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordWithCodeRequest request) {
        authService.resetPasswordWithCode(request);
        return ApiResponse.success("Password reset successfully");
    }

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Current user loaded successfully", authService.getCurrentUser(requireUserId(user)));
    }

    @PutMapping("/me")
    public ApiResponse<UserResponse> updateMe(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return ApiResponse.success("Profile updated successfully", authService.updateCurrentUser(requireUserId(user), request));
    }

    @PostMapping("/change-password-first-time")
    public ApiResponse<UserResponse> changePasswordFirstTime(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ChangePasswordFirstTimeRequest request
    ) {
        return ApiResponse.success(
                "Password changed successfully",
                authService.changePasswordFirstTime(requireUserId(user), request)
        );
    }
}
