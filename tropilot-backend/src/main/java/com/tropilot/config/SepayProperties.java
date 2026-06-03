package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.sepay")
public class SepayProperties {

    private boolean enabled = false;

    private String qrBaseUrl = "https://qr.sepay.vn/img";

    private String bankCode;

    private String accountNumber;

    private String accountName;

    private String qrTemplate = "compact";

    private String paymentCodePrefix = "TPINV";

    private String webhookSecret;

    public boolean isReady() {
        return enabled
                && hasText(bankCode)
                && hasText(accountNumber)
                && hasText(accountName);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
