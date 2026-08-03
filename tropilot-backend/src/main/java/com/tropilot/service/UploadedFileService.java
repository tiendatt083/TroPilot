package com.tropilot.service;

import com.tropilot.security.AuthenticatedUser;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

/** Hợp đồng tải tệp đã lưu sau khi kiểm tra quyền truy cập của người dùng. */
public interface UploadedFileService {

    AuthorizedFile load(String rawPath, AuthenticatedUser user);

    record AuthorizedFile(Resource resource, MediaType contentType, String filename) {
    }
}
