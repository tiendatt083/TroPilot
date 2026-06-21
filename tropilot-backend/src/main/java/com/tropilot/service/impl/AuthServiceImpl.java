package com.tropilot.service.impl;

import com.tropilot.dto.request.ChangePasswordFirstTimeRequest;
import com.tropilot.dto.request.ForgotPasswordRequest;
import com.tropilot.dto.request.LoginRequest;
import com.tropilot.dto.request.ProfileUpdateRequest;
import com.tropilot.dto.request.ResetPasswordWithCodeRequest;
import com.tropilot.dto.response.LoginResponse;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.PasswordResetCode;
import com.tropilot.entity.RoomAssignment;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.mapper.UserMapper;
import com.tropilot.repository.PasswordResetCodeRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.security.JwtService;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.AuthService;
import com.tropilot.service.PasswordResetEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int RESET_CODE_EXPIRATION_MINUTES = 10;
    private static final int RESET_CODE_MAX_ATTEMPTS = 5;
    private static final String UNKNOWN_RESET_EMAIL_MESSAGE = "Email is not registered";
    private static final String INVALID_RESET_CODE_MESSAGE = "Invalid or expired verification code";

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final ActivityLogService activityLogService;
    private final PasswordResetEmailService passwordResetEmailService;
    private final SecureRandom secureRandom = new SecureRandom();

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
    @Transactional
    public void requestPasswordResetCode(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            throw new BadRequestException(UNKNOWN_RESET_EMAIL_MESSAGE);
        }

        User user = optionalUser.get();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(UNKNOWN_RESET_EMAIL_MESSAGE);
        }

        LocalDateTime now = LocalDateTime.now();
        passwordResetCodeRepository.markUnusedCodesAsUsed(user, now);

        String code = generateResetCode();
        LocalDateTime expiresAt = now.plusMinutes(RESET_CODE_EXPIRATION_MINUTES);
        PasswordResetCode resetCode = PasswordResetCode.builder()
                .user(user)
                .codeHash(hashResetCode(email, code))
                .expiresAt(expiresAt)
                .attemptCount(0)
                .build();

        passwordResetCodeRepository.save(resetCode);
        passwordResetEmailService.sendPasswordResetCodeEmail(user, code, expiresAt);
    }

    @Override
    @Transactional
    public void resetPasswordWithCode(ResetPasswordWithCodeRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(INVALID_RESET_CODE_MESSAGE));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        PasswordResetCode resetCode = passwordResetCodeRepository
                .findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new BadRequestException(INVALID_RESET_CODE_MESSAGE));

        LocalDateTime now = LocalDateTime.now();
        if (resetCode.getExpiresAt().isBefore(now) || resetCode.getAttemptCount() >= RESET_CODE_MAX_ATTEMPTS) {
            resetCode.setUsedAt(now);
            passwordResetCodeRepository.save(resetCode);
            throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
        }

        String codeHash = hashResetCode(email, normalizeCode(request.getCode()));
        if (!MessageDigest.isEqual(
                resetCode.getCodeHash().getBytes(StandardCharsets.UTF_8),
                codeHash.getBytes(StandardCharsets.UTF_8)
        )) {
            resetCode.setAttemptCount(resetCode.getAttemptCount() + 1);
            if (resetCode.getAttemptCount() >= RESET_CODE_MAX_ATTEMPTS) {
                resetCode.setUsedAt(now);
            }
            passwordResetCodeRepository.save(resetCode);
            throw new BadRequestException(INVALID_RESET_CODE_MESSAGE);
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new BadRequestException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        user.setTemporaryPasswordEncrypted(null);
        resetCode.setUsedAt(now);

        userRepository.save(user);
        passwordResetCodeRepository.save(resetCode);
        activityLogService.record(user, "PASSWORD_RESET", "Reset password with verification code");
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = findUser(userId);
        RoomAssignment activeAssignment = roomAssignmentRepository
                .findByResidentHeadIdAndStatus(userId, RoomAssignmentStatus.ACTIVE)
                .orElse(null);

        return userMapper.toResponse(user, activeAssignment);
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUser(Long userId, ProfileUpdateRequest request) {
        User user = findUser(userId);
        validateLoginStatus(user);

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

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim();
    }

    private String generateResetCode() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    private String hashResetCode(String email, String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest((email + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm is not available", exception);
        }
    }

    private String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
