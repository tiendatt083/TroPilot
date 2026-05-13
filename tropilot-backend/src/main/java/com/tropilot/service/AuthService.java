package com.tropilot.service;

import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    UserResponse getCurrentUser(Long userId);

    UserResponse changePasswordFirstTime(Long userId, ChangePasswordFirstTimeRequest request);
}
