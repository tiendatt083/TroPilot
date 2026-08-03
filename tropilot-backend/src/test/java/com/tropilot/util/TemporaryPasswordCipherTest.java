package com.tropilot.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Kiểm tra mật khẩu tạm giải mã được với đúng secret và bị từ chối khi secret thay đổi hoặc quá ngắn. */
class TemporaryPasswordCipherTest {

    private static final String SECRET = "TemporaryPasswordCipherTestSecret123456";

    @Test
    void decryptsPasswordAfterCipherIsRecreatedWithSameSecret() {
        TemporaryPasswordCipher firstCipher = new TemporaryPasswordCipher(SECRET);
        String encryptedPassword = firstCipher.encrypt("Temporary@123");

        TemporaryPasswordCipher restartedCipher = new TemporaryPasswordCipher(SECRET);

        assertThat(restartedCipher.decrypt(encryptedPassword)).isEqualTo("Temporary@123");
    }

    @Test
    void rejectsEncryptedPasswordWhenSecretChanges() {
        TemporaryPasswordCipher originalCipher = new TemporaryPasswordCipher(SECRET);
        String encryptedPassword = originalCipher.encrypt("Temporary@123");
        TemporaryPasswordCipher changedCipher = new TemporaryPasswordCipher(
                "DifferentTemporaryPasswordCipherSecret456"
        );

        assertThatThrownBy(() -> changedCipher.decrypt(encryptedPassword))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_TEMPORARY_PASSWORD_ENCRYPTION_SECRET");
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new TemporaryPasswordCipher("too-short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 characters");
    }
}
