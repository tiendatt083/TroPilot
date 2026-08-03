package com.tropilot.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

@Component
/**
 * Mã hóa và giải mã mật khẩu tạm trước khi lưu trong cơ sở dữ liệu.
 * Lớp dùng AES-GCM: mỗi lần mã hóa có IV ngẫu nhiên, giúp cùng một mật khẩu không tạo ra cùng một dữ liệu mã hóa.
 */
public class TemporaryPasswordCipher {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;
    private static final int MINIMUM_SECRET_LENGTH = 32;

    private final SecureRandom secureRandom = new SecureRandom();
    private final SecretKeySpec secretKey;

    /**
     * Kiểm tra secret cấu hình có đủ dài rồi băm SHA-256 để tạo khóa AES cố định cho ứng dụng.
     */
    public TemporaryPasswordCipher(@Value("${app.temporary-password.encryption-secret}") String secret) {
        if (secret == null || secret.isBlank() || secret.length() < MINIMUM_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "APP_TEMPORARY_PASSWORD_ENCRYPTION_SECRET must contain at least 32 characters"
            );
        }

        this.secretKey = new SecretKeySpec(sha256(secret), "AES");
    }

    /**
     * Mã hóa mật khẩu tạm bằng AES-GCM và trả về chuỗi "IV:dữ-liệu-mã-hóa" ở dạng Base64.
     */
    public String encrypt(String value) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));

            return Base64.getEncoder().encodeToString(iv) + ":" + Base64.getEncoder().encodeToString(encrypted);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Temporary password could not be encrypted", exception);
        }
    }

    /**
     * Tách IV và dữ liệu mã hóa từ chuỗi đã lưu, sau đó giải mã bằng đúng khóa cấu hình.
     */
    public String decrypt(String value) {
        try {
            String[] parts = value.split(":", 2);
            if (parts.length != 2) {
                throw decryptionException(null);
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encrypted = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException | GeneralSecurityException exception) {
            throw decryptionException(exception);
        }
    }

    /** Tạo lỗi giải mã có thông báo hướng dẫn kiểm tra secret cấu hình, giữ lại nguyên nhân gốc nếu có. */
    private IllegalStateException decryptionException(Exception cause) {
        return new IllegalStateException(
                "Temporary password could not be decrypted. Verify APP_TEMPORARY_PASSWORD_ENCRYPTION_SECRET.",
                cause
        );
    }

    /** Băm secret về 32 byte bằng SHA-256 để phù hợp làm khóa AES. */
    private byte[] sha256(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }
}
