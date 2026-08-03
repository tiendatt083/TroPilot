package com.tropilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
/**
 * Điểm khởi động của ứng dụng Spring Boot TroPilot.
 * @ConfigurationPropertiesScan giúp Spring tự đọc các lớp cấu hình có @ConfigurationProperties.
 */
public class TropilotApplication {

    /** Khởi tạo Spring, nạp cấu hình, bean và mở web server của backend. */
    public static void main(String[] args) {
        SpringApplication.run(TropilotApplication.class, args);
    }
}
