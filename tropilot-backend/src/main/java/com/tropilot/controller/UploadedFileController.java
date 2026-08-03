package com.tropilot.controller;

import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.UploadedFileService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
/**
 * Trả file người dùng đã tải lên, ví dụ hợp đồng hoặc ảnh bảo trì.
 * Service kiểm tra quyền trước khi file được gửi về để tránh truy cập trái phép.
 */
public class UploadedFileController {

    // Phần tiền tố cần bỏ đi để lấy đường dẫn file tương đối người dùng yêu cầu.
    private static final String MAPPING_PREFIX = "/api/files/";

    private final UploadedFileService uploadedFileService;

    @GetMapping("/**")
    // Bắt mọi URL bên dưới /api/files/ và trả file dưới dạng hiển thị trực tiếp trên trình duyệt.
    public ResponseEntity<Resource> getFile(
            HttpServletRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
        // load() vừa tìm file vừa kiểm tra người dùng hiện tại có quyền xem file đó.
        UploadedFileService.AuthorizedFile file = uploadedFileService.load(extractPath(request), user);

        return ResponseEntity.ok()
                .contentType(file.contentType())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline()
                        .filename(file.filename())
                        .build()
                        .toString())
                .body(file.resource());
    }

    private String extractPath(HttpServletRequest request) {
        // Request URI còn chứa context path và prefix API; service chỉ cần phần đường dẫn file phía sau.
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.startsWith(MAPPING_PREFIX)) {
            return path.substring(MAPPING_PREFIX.length());
        }

        return "";
    }
}
