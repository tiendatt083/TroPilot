package com.rentalhub.backend.service;

import com.rentalhub.backend.dto.AuthResponse;
import com.rentalhub.backend.dto.LoginRequest;
import com.rentalhub.backend.dto.RegisterRequest;
import com.rentalhub.backend.model.User;
import com.rentalhub.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        if (userRepository.existsByEmailOrPhoneAndRole(request.getEmailOrPhone(), request.getRole())) {
            throw new RuntimeException("Email or Phone already registered for this role");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .emailOrPhone(request.getEmailOrPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        User savedUser = userRepository.save(user);

        return mapToAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailOrPhoneAndRole(request.getEmailOrPhone(), request.getRole())
                .orElseThrow(() -> new RuntimeException("Account does not exist for this role. Please register first."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email/phone or password");
        }

        // We already verified the role via the database query above
        
        return mapToAuthResponse(user);
    }

    private AuthResponse mapToAuthResponse(User user) {
        return AuthResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .emailOrPhone(user.getEmailOrPhone())
                .role(user.getRole())
                .build();
    }
}
