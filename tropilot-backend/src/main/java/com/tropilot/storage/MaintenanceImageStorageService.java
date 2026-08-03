package com.tropilot.storage;

import com.tropilot.config.UploadProperties;
import com.tropilot.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
/**
 * Lưu ảnh đính kèm cho yêu cầu và kết quả bảo trì vào uploads/maintenance.
 * Ảnh là tùy chọn: nếu không gửi tệp, service trả về null thay vì tạo tệp rỗng.
 */
public class MaintenanceImageStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");

    private final UploadProperties uploadProperties;

    /** Lưu ảnh JPEG/PNG hợp lệ tối đa 10 MB với tên UUID và trả về URL truy cập ảnh. */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "." + extension;
        Path maintenanceDirectory = Path.of(uploadProperties.getBasePath(), "maintenance")
                .toAbsolutePath()
                .normalize();
        Path destination = maintenanceDirectory.resolve(storedFileName).normalize();

        if (!destination.startsWith(maintenanceDirectory)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(maintenanceDirectory);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Maintenance image could not be uploaded");
        }

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/maintenance/")
                .path(storedFileName)
                .toUriString();
    }

    /** Kiểm tra dung lượng, phần mở rộng và content type của ảnh bảo trì. */
    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Maintenance image must not exceed 10 MB");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Maintenance image type is not allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Maintenance image content type is not allowed");
        }
    }

    /** Tách và chuẩn hóa phần mở rộng ảnh, đồng thời chặn tên tệp không hợp lệ. */
    private String getExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            throw new BadRequestException("Maintenance image type is not allowed");
        }

        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
