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
public class UploadedFileController {

    private static final String MAPPING_PREFIX = "/api/files/";

    private final UploadedFileService uploadedFileService;

    @GetMapping("/**")
    public ResponseEntity<Resource> getFile(
            HttpServletRequest request,
            @AuthenticationPrincipal AuthenticatedUser user
    ) {
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
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (path.startsWith(MAPPING_PREFIX)) {
            return path.substring(MAPPING_PREFIX.length());
        }

        return "";
    }
}
