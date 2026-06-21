package com.tropilot.service;

import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.ForgotPasswordRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.request.ProfileUpdateRequest;
import com.tropilot.dto.request.ResetPasswordWithCodeRequest;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void requestPasswordResetCode(ForgotPasswordRequest request);

    void resetPasswordWithCode(ResetPasswordWithCodeRequest request);

    UserResponse getCurrentUser(Long userId);

    UserResponse updateCurrentUser(Long userId, ProfileUpdateRequest request);

    UserResponse changePasswordFirstTime(Long userId, ChangePasswordFirstTimeRequest request);
}
