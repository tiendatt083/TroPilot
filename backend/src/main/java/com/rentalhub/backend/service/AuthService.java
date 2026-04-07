package com.rentalhub.backend.service;

import com.rentalhub.backend.dto.*;

public interface AuthService {
    void sendRegisterOtp(SendOtpRequest request);
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse googleLogin(GoogleLoginRequest request) throws Exception;
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
