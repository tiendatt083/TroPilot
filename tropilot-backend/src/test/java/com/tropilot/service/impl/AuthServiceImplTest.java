package com.tropilot.service.impl;

import com.tropilot.dto.request.ForgotPasswordRequest;
import com.tropilot.dto.request.ResetPasswordWithCodeRequest;
import com.tropilot.entity.PasswordResetCode;
import com.tropilot.entity.User;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.UserMapper;
import com.tropilot.repository.PasswordResetCodeRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.security.JwtService;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.PasswordResetEmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra luồng gửi mã, xác thực mã và đặt lại mật khẩu của AuthService. */
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetCodeRepository passwordResetCodeRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private PasswordResetEmailService passwordResetEmailService;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void requestPasswordResetCodeCreatesCodeAndSendsEmailForActiveUser() {
        User user = BusinessRuleTestFixtures.residentHead();
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail(" Resident@Test.Local ");
        when(userRepository.findByEmail("resident@test.local")).thenReturn(Optional.of(user));

        authService.requestPasswordResetCode(request);

        ArgumentCaptor<PasswordResetCode> resetCodeCaptor = ArgumentCaptor.forClass(PasswordResetCode.class);
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<LocalDateTime> expiresAtCaptor = ArgumentCaptor.forClass(LocalDateTime.class);

        verify(passwordResetCodeRepository).markUnusedCodesAsUsed(eq(user), any(LocalDateTime.class));
        verify(passwordResetCodeRepository).save(resetCodeCaptor.capture());
        verify(passwordResetEmailService).sendPasswordResetCodeEmail(eq(user), codeCaptor.capture(), expiresAtCaptor.capture());

        PasswordResetCode resetCode = resetCodeCaptor.getValue();
        String rawCode = codeCaptor.getValue();
        assertThat(rawCode).matches("\\d{6}");
        assertThat(resetCode.getUser()).isEqualTo(user);
        assertThat(resetCode.getCodeHash()).hasSize(64).doesNotContain(rawCode);
        assertThat(resetCode.getExpiresAt()).isEqualTo(expiresAtCaptor.getValue());
    }

    @Test
    void requestPasswordResetCodeRejectsMissingEmail() {
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("missing@test.local");
        when(userRepository.findByEmail("missing@test.local")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.requestPasswordResetCode(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email is not registered");

        verifyNoInteractions(passwordResetCodeRepository, passwordResetEmailService);
    }

    @Test
    void resetPasswordWithCodeUpdatesPasswordAndConsumesCode() {
        User user = BusinessRuleTestFixtures.residentHead();
        user.setPassword("old-hash");
        user.setMustChangePassword(true);
        user.setTemporaryPasswordEncrypted("encrypted-temporary-password");
        PasswordResetCode resetCode = PasswordResetCode.builder()
                .user(user)
                .codeHash(hashResetCode("resident@test.local", "123456"))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attemptCount(0)
                .build();
        ResetPasswordWithCodeRequest request = resetRequest("resident@test.local", "123456", "new-password");

        when(userRepository.findByEmail("resident@test.local")).thenReturn(Optional.of(user));
        when(passwordResetCodeRepository.findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(resetCode));
        when(passwordEncoder.matches("new-password", "old-hash")).thenReturn(false);
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        authService.resetPasswordWithCode(request);

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.isMustChangePassword()).isFalse();
        assertThat(user.getTemporaryPasswordEncrypted()).isNull();
        assertThat(resetCode.getUsedAt()).isNotNull();
        verify(userRepository).save(user);
        verify(passwordResetCodeRepository).save(resetCode);
        verify(activityLogService).record(user, "PASSWORD_RESET", "Reset password with verification code");
    }

    @Test
    void resetPasswordWithWrongCodeCountsAttemptAndRejects() {
        User user = BusinessRuleTestFixtures.residentHead();
        PasswordResetCode resetCode = PasswordResetCode.builder()
                .user(user)
                .codeHash(hashResetCode("resident@test.local", "123456"))
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attemptCount(4)
                .build();
        ResetPasswordWithCodeRequest request = resetRequest("resident@test.local", "000000", "new-password");

        when(userRepository.findByEmail("resident@test.local")).thenReturn(Optional.of(user));
        when(passwordResetCodeRepository.findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(user))
                .thenReturn(Optional.of(resetCode));

        assertThatThrownBy(() -> authService.resetPasswordWithCode(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Invalid or expired verification code");

        assertThat(resetCode.getAttemptCount()).isEqualTo(5);
        assertThat(resetCode.getUsedAt()).isNotNull();
        verify(passwordResetCodeRepository).save(resetCode);
        verify(userRepository, never()).save(any(User.class));
    }

    private ResetPasswordWithCodeRequest resetRequest(String email, String code, String newPassword) {
        ResetPasswordWithCodeRequest request = new ResetPasswordWithCodeRequest();
        request.setEmail(email);
        request.setCode(code);
        request.setNewPassword(newPassword);
        request.setConfirmPassword(newPassword);
        return request;
    }

    private String hashResetCode(String email, String code) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest((email + ":" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
