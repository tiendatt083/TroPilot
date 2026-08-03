package com.tropilot.config;

import com.tropilot.security.ResidentRoomAccessInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
@RequiredArgsConstructor
/**
 * Cấu hình lớp web của Spring MVC.
 *
 * <p>File này làm hai việc: cho phép frontend ở domain hợp lệ gọi API qua CORS,
 * và chèn interceptor để kiểm tra quyền truy cập phòng của cư dân trước khi
 * request đi vào controller.</p>
 */
public class WebConfig implements WebMvcConfigurer {

    private final CorsProperties corsProperties;
    private final ResidentRoomAccessInterceptor residentRoomAccessInterceptor;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Chỉ các origin khai báo trong cấu hình mới được trình duyệt cho gọi API.
        configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
        // Các HTTP method mà frontend được phép dùng.
        configuration.setAllowedMethods(List.of(
                HttpMethod.GET.name(),
                HttpMethod.POST.name(),
                HttpMethod.PUT.name(),
                HttpMethod.PATCH.name(),
                HttpMethod.DELETE.name(),
                HttpMethod.OPTIONS.name()
        ));
        // Header frontend được gửi và header được phép đọc từ response.
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        // Cho phép gửi cookie/thông tin xác thực khi gọi cross-origin.
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng cùng chính sách CORS cho mọi endpoint của backend.
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Mọi API dành cho cư dân phải được kiểm tra cư dân có thuộc phòng đang
        // được truy cập không. Endpoint xem "phòng của tôi" được loại trừ vì nó
        // dùng để xác định phòng hiện tại trước khi có roomId để kiểm tra.
        registry.addInterceptor(residentRoomAccessInterceptor)
                .addPathPatterns("/api/resident/**")
                .excludePathPatterns("/api/resident/room", "/api/resident/room/");
    }
}
