package com.rentalhub.backend.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.rentalhub.backend.dto.*;
import com.rentalhub.backend.model.AuthProvider;
import com.rentalhub.backend.model.Otp;
import com.rentalhub.backend.model.User;
import com.rentalhub.backend.repository.OtpRepository;
import com.rentalhub.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // TODO: Thay bằng Client ID thực tế của Google Cloud Console
    private static final String CLIENT_ID = "1086823449607-28as6rc3u36h7guljsp5vrrgrpr2lpr2.apps.googleusercontent.com";

    @Override
    @Transactional
    public void sendRegisterOtp(SendOtpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký. Mỗi email chỉ được đăng ký 1 vai trò duy nhất.");
        }

        otpRepository.deleteByEmail(request.getEmail()); // xoá mã cũ

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        Otp otp = Otp.builder()
                .email(request.getEmail())
                .otpCode(otpCode)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(request.getEmail(), otpCode, "Mã OTP Xác Nhận Đăng Ký Tài Khoản");
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được đăng ký. Mỗi email chỉ được đăng ký 1 vai trò duy nhất.");
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Số điện thoại đã được đăng ký. Mỗi sđt chỉ được đăng ký 1 vai trò duy nhất.");
        }

        Otp otp = otpRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã OTP. Hãy gửi lại mã."));

        if (!otp.getOtpCode().equals(request.getOtp())) {
            throw new RuntimeException("Mã OTP không đúng.");
        }

        if (otp.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .authProvider(AuthProvider.LOCAL)
                .build();

        User savedUser = userRepository.save(user);
        otpRepository.deleteByEmail(request.getEmail()); // xoá mã OTP sau khi đăng ký thành công

        return mapToAuthResponse(savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại. Vui lòng đăng ký trước."));

        if (user.getRole() != request.getRole()) {
            throw new RuntimeException("Email này thuộc về vai trò " + user.getRole() + ". Hãy đổi vai trò để đăng nhập.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác.");
        }

        return mapToAuthResponse(user);
    }

    @Override
    public AuthResponse googleLogin(GoogleLoginRequest request) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                .setAudience(Collections.singletonList(CLIENT_ID))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(request.getCredential());
        } catch (Exception e) {
            System.err.println("Google verify error (maybe CLIENT_ID is fake): " + e.getMessage());
            throw new RuntimeException(
                    "Lỗi xác thực Google Token: Bạn cần cấu hình CLIENT_ID thật vào AuthServiceImpl");
        }

        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            User user = userRepository.findByEmail(email).orElse(null);

            if (user != null && user.getRole() != request.getRole()) {
                throw new RuntimeException("Email tài khoản Google này đã được đăng ký cho vai trò " + user.getRole() + ". Bạn không thể đăng nhập với vai trò hiện tại.");
            }

            if (user == null) {
                user = User.builder()
                        .fullName(name)
                        .email(email)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .role(request.getRole())
                        .authProvider(AuthProvider.GOOGLE)
                        .build();
                user = userRepository.save(user);
            }

            return mapToAuthResponse(user);
        } else {
            throw new RuntimeException("Invalid Google ID token.");
        }
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

        if (user.getRole() != request.getRole()) {
            throw new RuntimeException("Email này thuộc về vai trò " + user.getRole() + ". Hãy đổi vai trò để cấp lại mật khẩu.");
        }

        otpRepository.deleteByEmail(request.getEmail()); // xoá mã cũ

        String otpCode = String.format("%06d", new Random().nextInt(999999));
        Otp otp = Otp.builder()
                .email(request.getEmail())
                .otpCode(otpCode)
                .expiryDate(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(request.getEmail(), otpCode, "Mã OTP Đặt Lại Mật Khẩu");
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Otp otp = otpRepository.findTopByEmailOrderByCreatedAtDesc(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy OTP. Hãy yêu cầu gửi lại."));

        if (!otp.getOtpCode().equals(request.getOtp())) {
            throw new RuntimeException("Mã OTP không đúng.");
        }

        if (otp.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn.");
        }

        User user = userRepository.findByEmailAndRole(request.getEmail(), request.getRole())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        otpRepository.deleteByEmail(request.getEmail()); // xoá mã sau khi đổi thành công
    }

    private AuthResponse mapToAuthResponse(User user) {
        return AuthResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .build();
    }
}
