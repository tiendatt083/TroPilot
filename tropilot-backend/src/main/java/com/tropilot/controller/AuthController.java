package com.tropilot.controller;

import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/me")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Current user loaded successfully", authService.getCurrentUser(getUserId(user)));
    }

    @PostMapping("/change-password-first-time")
    public ApiResponse<UserResponse> changePasswordFirstTime(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ChangePasswordFirstTimeRequest request
    ) {
        return ApiResponse.success(
                "Password changed successfully",
                authService.changePasswordFirstTime(getUserId(user), request)
        );
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
