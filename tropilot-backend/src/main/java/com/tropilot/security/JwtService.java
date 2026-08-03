package com.tropilot.security;

import com.tropilot.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Service
/**
 * Dịch vụ tạo và kiểm tra JSON Web Token (JWT) dùng cho đăng nhập không lưu session.
 * Token được ký bằng khóa bí mật cấu hình và chứa email cùng vai trò của người dùng.
 */
public class JwtService {

    private static final String INSECURE_DEFAULT_SECRET =
            "TropilotJwtSecretForAcademicProjectChangeBeforeProduction2026";
    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey signingKey;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes
    ) {
        // Kiểm tra khóa ký có đủ mạnh trước khi ứng dụng nhận request.
        if (secret == null || secret.isBlank() || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("APP_JWT_SECRET must contain at least 32 characters");
        }

        // Không cho phép chạy production bằng khóa mẫu có sẵn trong mã nguồn.
        if (INSECURE_DEFAULT_SECRET.equals(secret)) {
            throw new IllegalStateException("APP_JWT_SECRET must not use the demo default value");
        }

        signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    /** Tạo JWT chứa email, role, thời điểm phát hành và thời điểm hết hạn. */
    public String generateToken(String email, UserRole role) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(email)
                .claim("role", role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(signingKey)
                .compact();
    }

    /** Đọc email (subject) từ token đã được kiểm tra chữ ký. */
    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    /** Kiểm tra token thuộc đúng người dùng và tài khoản vẫn đang hoạt động, không bị khóa. */
    public boolean isTokenValid(String token, AuthenticatedUser user) {
        String email = extractEmail(token);

        return email.equals(user.getEmail()) && user.isEnabled() && user.isAccountNonLocked();
    }

    /** Phân tích token, đồng thời xác minh chữ ký bằng khóa bí mật trước khi trả về claims. */
    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
