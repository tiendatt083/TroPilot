package com.tropilot.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Kiểm tra JWT service từ chối secret bị thiếu hoặc secret mẫu không an toàn. */
class JwtServiceTest {

    @Test
    void constructorRejectsMissingSecret() {
        assertThatThrownBy(() -> new JwtService("", 60))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_JWT_SECRET");
    }

    @Test
    void constructorRejectsDemoDefaultSecret() {
        assertThatThrownBy(() -> new JwtService(
                "TropilotJwtSecretForAcademicProjectChangeBeforeProduction2026",
                60
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("demo default");
    }
}
