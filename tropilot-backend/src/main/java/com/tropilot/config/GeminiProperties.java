package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.gemini")
public class GeminiProperties {

    private boolean enabled = false;

    private String apiKey;

    private String baseUrl = "https://generativelanguage.googleapis.com";

    private String model = "gemini-2.5-flash-lite";

    private int connectTimeoutSeconds = 10;

    private int readTimeoutSeconds = 30;

    private int maxHistoryMessages = 8;

    public boolean isReady() {
        return enabled
                && hasText(apiKey)
                && hasText(baseUrl)
                && hasText(model);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
