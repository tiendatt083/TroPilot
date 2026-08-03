package com.tropilot.repository;

import com.tropilot.entity.SystemContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository lưu thông tin liên hệ chung của hệ thống, ví dụ số điện thoại hoặc email ban quản lý.
 */
public interface SystemContactRepository extends JpaRepository<SystemContact, Long> {

    /** Lấy bản ghi liên hệ đầu tiên; hệ thống thường chỉ sử dụng một cấu hình liên hệ chung. */
    Optional<SystemContact> findFirstByOrderByIdAsc();
}
