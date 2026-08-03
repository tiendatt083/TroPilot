package com.tropilot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
/**
 * Khai báo HTTP client dùng riêng cho Gemini.
 *
 * <p>Đặt timeout ở đây để một lần gọi AI chậm hoặc mất kết nối không giữ request
 * của người dùng vô thời hạn.</p>
 */
public class GeminiClientConfig {

    /**
     * Tạo bean RestClient để các service có thể inject và gọi Gemini API.
     * Giá trị base URL và timeout được lấy từ {@link GeminiProperties}, không
     * viết cứng trong mã nguồn.
     */
    @Bean
    public RestClient geminiRestClient(GeminiProperties properties, RestClient.Builder builder) {
        // Timeout khi đang thiết lập kết nối TCP/HTTPS tới Gemini.
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.getConnectTimeoutSeconds()))
                .build();

        // Timeout khi đã kết nối nhưng Gemini chưa trả dữ liệu phản hồi.
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(properties.getReadTimeoutSeconds()));

        // RestClient này chưa gắn API key; service gọi Gemini sẽ thêm header/key phù hợp.
        return builder
                .baseUrl(properties.getBaseUrl())
                .requestFactory(requestFactory)
                .build();
    }
}
