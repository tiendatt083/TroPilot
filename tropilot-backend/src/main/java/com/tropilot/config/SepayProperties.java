package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.sepay")
/**
 * Nhóm cấu hình cho luồng thanh toán SePay: tạo mã QR và nhận webhook báo giao dịch.
 * Các giá trị nhạy cảm như số tài khoản và webhook secret được cấp qua biến môi trường.
 */
public class SepayProperties {

    // Tắt mặc định để môi trường local không vô tình thực hiện luồng thanh toán thật.
    private boolean enabled = false;

    private String qrBaseUrl = "https://qr.sepay.vn/img";

    private String bankCode;

    private String accountNumber;

    private String accountName;

    private String qrTemplate = "compact";

    // Tiền tố tạo mã thanh toán duy nhất cho mỗi hóa đơn của TroPilot.
    private String paymentCodePrefix = "TPINV";

    // Khóa dùng để xác thực webhook gửi từ SePay.
    private String webhookSecret;

    /**
     * Xác nhận SePay có thể được dùng để tạo QR hay chưa.
     * Webhook secret không nằm trong điều kiện này vì việc tạo QR chỉ cần thông
     * tin ngân hàng; khi nhận webhook, phần xử lý webhook sẽ kiểm tra secret riêng.
     */
    public boolean isReady() {
        return enabled
                && StringUtils.hasText(bankCode)
                && StringUtils.hasText(accountNumber)
                && StringUtils.hasText(accountName);
    }
}
