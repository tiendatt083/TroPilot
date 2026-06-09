package com.tropilot.service.impl;

import com.tropilot.mapper.UserMapper;
import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.request.ProfileUpdateRequest;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.repository.UserRepository;
import com.tropilot.security.JwtService;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        validateLoginStatus(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole());

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        return userMapper.toResponse(findUser(userId));
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUser(Long userId, ProfileUpdateRequest request) {
        User user = findUser(userId);
        validateLoginStatus(user);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(normalizeOptionalText(request.getPhone()));
        user.setIdentityNumber(normalizeOptionalText(request.getIdentityNumber()));

        User savedUser = userRepository.save(user);
        activityLogService.record(savedUser, "PROFILE_UPDATED", "Updated profile information");

        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse changePasswordFirstTime(Long userId, ChangePasswordFirstTimeRequest request) {
        User user = findUser(userId);

        if (!user.isMustChangePassword()) {
            throw new BadRequestException("Password change is not required for this account");
        }

        validateLoginStatus(user);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setTemporaryPasswordEncrypted(null);

        User savedUser = userRepository.save(user);
        activityLogService.record(savedUser, "FIRST_TIME_PASSWORD_CHANGED", "Changed first-time password");

        return userMapper.toResponse(savedUser);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateLoginStatus(User user) {
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new UnauthorizedException("User account is locked");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new UnauthorizedException("User account is inactive");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
