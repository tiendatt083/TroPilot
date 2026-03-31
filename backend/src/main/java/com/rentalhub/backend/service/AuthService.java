package com.rentalhub.backend.service;

import com.rentalhub.backend.dto.AuthResponse;
import com.rentalhub.backend.dto.LoginRequest;
import com.rentalhub.backend.dto.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
