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
 * Lưu tệp hợp đồng vào thư mục uploads/contracts.
 * Chỉ nhận ảnh JPEG/PNG hoặc PDF tối đa 10 MB, đổi tên ngẫu nhiên để tránh trùng và không dùng tên tệp người dùng gửi lên.
 */
public class ContractFileStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "pdf");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "application/pdf"
    );

    private final UploadProperties uploadProperties;

    /**
     * Kiểm tra tệp, lưu nó với UUID và trả về URL công khai tương đối của tệp hợp đồng.
     */
    public String store(MultipartFile file) {
        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "." + extension;
        Path contractDirectory = Path.of(uploadProperties.getBasePath(), "contracts")
                .toAbsolutePath()
                .normalize();
        Path destination = contractDirectory.resolve(storedFileName).normalize();

        if (!destination.startsWith(contractDirectory)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(contractDirectory);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Contract file could not be uploaded");
        }

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/contracts/")
                .path(storedFileName)
                .toUriString();
    }

    /** Kiểm tra tệp bắt buộc phải có, không vượt 10 MB và đúng cả phần mở rộng lẫn content type được cho phép. */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Contract file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Contract file must not exceed 10 MB");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Contract file type is not allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Contract file content type is not allowed");
        }
    }

    /** Lấy phần mở rộng đã chuẩn hóa; từ chối tên tệp không có phần mở rộng hợp lệ. */
    private String getExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            throw new BadRequestException("Contract file type is not allowed");
        }

        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
