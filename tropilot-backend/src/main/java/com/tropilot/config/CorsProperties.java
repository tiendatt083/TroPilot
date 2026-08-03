package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.cors")
/**
 * Nhận cấu hình CORS có tiền tố {@code app.cors} từ application.properties
 * hoặc biến môi trường tương ứng.
 *
 * <p>CORS quyết định website ở domain nào được phép gọi API backend từ trình
 * duyệt. Ví dụ mặc định cho phép frontend Vite chạy tại localhost:5173.</p>
 */
public class CorsProperties {

    // Có thể cấu hình nhiều frontend/domain được phép gọi API.
    private List<String> allowedOrigins = List.of("http://localhost:5173");
}
