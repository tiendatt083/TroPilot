package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.gemini")
/**
 * Nhóm cấu hình tích hợp Gemini AI. Spring tự ánh xạ các khóa như
 * {@code app.gemini.model} vào field {@code model}.
 */
public class GeminiProperties {

    // Tắt mặc định để ứng dụng vẫn chạy khi chưa cấu hình Gemini.
    private boolean enabled = false;

    // API key lấy từ biến môi trường; không nên ghi khóa thật vào Git.
    private String apiKey;

    private String baseUrl = "https://generativelanguage.googleapis.com";

    // Model chính được thử gọi đầu tiên.
    private String model = "gemini-2.5-flash-lite";

    // Danh sách model thay thế khi model chính không khả dụng.
    private List<String> fallbackModels = new ArrayList<>();

    private int connectTimeoutSeconds = 10;

    private int readTimeoutSeconds = 30;

    // Số tin nhắn cũ tối đa được gửi kèm để chatbot giữ được ngữ cảnh hội thoại.
    private int maxHistoryMessages = 8;

    /**
     * Kiểm tra tích hợp Gemini có đủ điều kiện để sử dụng hay không.
     * Không chỉ kiểm tra bật/tắt mà còn yêu cầu các giá trị bắt buộc không rỗng,
     * nhờ đó service có thể từ chối gọi API khi cấu hình chưa hoàn chỉnh.
     */
    public boolean isReady() {
        return enabled
                && StringUtils.hasText(apiKey)
                && StringUtils.hasText(baseUrl)
                && StringUtils.hasText(model);
    }
}
