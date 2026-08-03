package com.tropilot.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.upload")
/**
 * Cấu hình thư mục gốc lưu file do người dùng tải lên.
 *
 * <p>Các service lưu hợp đồng, ảnh bảo trì, ảnh thanh toán... sẽ tạo các thư mục
 * con bên trong đường dẫn này. Giá trị mặc định {@code uploads} là đường dẫn
 * tương đối tính từ thư mục chạy backend.</p>
 */
public class UploadProperties {

    private String basePath = "uploads";
}
