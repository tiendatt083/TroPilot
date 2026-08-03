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
 * Lưu ảnh minh chứng thanh toán của cư dân vào uploads/payments.
 * Tệp minh chứng là bắt buộc, chỉ nhận JPEG/PNG tối đa 10 MB.
 */
public class PaymentProofStorageService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png");

    private final UploadProperties uploadProperties;

    /** Kiểm tra ảnh minh chứng, lưu tên UUID và trả URL dùng trong dữ liệu phiếu thanh toán. */
    public String store(MultipartFile file) {
        validateFile(file);

        String extension = getExtension(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + "." + extension;
        Path paymentDirectory = Path.of(uploadProperties.getBasePath(), "payments")
                .toAbsolutePath()
                .normalize();
        Path destination = paymentDirectory.resolve(storedFileName).normalize();

        if (!destination.startsWith(paymentDirectory)) {
            throw new BadRequestException("Invalid file path");
        }

        try {
            Files.createDirectories(paymentDirectory);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new BadRequestException("Payment proof could not be uploaded");
        }

        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/payments/")
                .path(storedFileName)
                .toUriString();
    }

    /** Kiểm tra ảnh bắt buộc, dung lượng tối đa, phần mở rộng và kiểu nội dung an toàn. */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Payment proof file is required");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Payment proof file must not exceed 10 MB");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Payment proof file type is not allowed");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Payment proof file content type is not allowed");
        }
    }

    /** Lấy phần mở rộng ảnh đã chuẩn hóa hoặc ném lỗi nếu tên tệp không hợp lệ. */
    private String getExtension(String fileName) {
        if (fileName == null || fileName.isBlank() || !fileName.contains(".")) {
            throw new BadRequestException("Payment proof file type is not allowed");
        }

        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }
}
