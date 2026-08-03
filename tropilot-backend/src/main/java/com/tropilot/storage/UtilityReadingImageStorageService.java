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
 * Lưu ảnh đồng hồ điện hoặc nước vào uploads/utility-readings.
 * fieldLabel được dùng để tạo thông báo lỗi đúng với trường ảnh đang được người dùng gửi lên.
 */
public class UtilityReadingImageStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");

    private final UploadProperties uploadProperties;

    /** Kiểm tra và lưu ảnh chỉ số bắt buộc, rồi trả URL phục vụ hiển thị/lưu bản ghi chỉ số. */
    public String store(MultipartFile file, String fieldLabel) {
        validateFile(file, fieldLabel);

        String extension = getExtension(file.getOriginalFilename(), fieldLabel);
        String storedFileName = UUID.randomUUID() + "." + extension;
        Path utilityReadingDirectory = Path.of(uploadProperties.getBasePath(), "utility-readings")
                .toAbsolutePath()
                .normalize();
        Path destination = utilityReadingDirectory.resolve(storedFileName).normalize();

        if (!destination.startsWith(utilityReadingDirectory)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(utilityReadingDirectory);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException(fieldLabel + " could not be uploaded");
        }

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/utility-readings/")
                .path(storedFileName)
                .toUriString();
    }

    /** Kiểm tra tệp ảnh bắt buộc, tối đa 10 MB và chỉ chấp nhận JPEG hoặc PNG. */
    private void validateFile(MultipartFile file, String fieldLabel) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(fieldLabel + " is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException(fieldLabel + " must not exceed 10 MB");
        }

        String extension = getExtension(file.getOriginalFilename(), fieldLabel);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException(fieldLabel + " type is not allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException(fieldLabel + " content type is not allowed");
        }
    }

    /** Lấy phần mở rộng và đưa tên trường vào lỗi để người dùng biết ảnh nào không hợp lệ. */
    private String getExtension(String fileName, String fieldLabel) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            throw new BadRequestException(fieldLabel + " type is not allowed");
        }

        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
