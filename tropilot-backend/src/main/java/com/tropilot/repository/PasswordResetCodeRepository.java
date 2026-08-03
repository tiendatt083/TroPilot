package com.tropilot.repository;

import com.tropilot.entity.PasswordResetCode;
import com.tropilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository quản lý mã đặt lại mật khẩu.
 * Mã có thể được đánh dấu đã dùng để bảo đảm mỗi mã chỉ được sử dụng một lần.
 */
public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    /** Lấy mã đặt lại mật khẩu mới nhất chưa dùng của một người dùng. */
    Optional<PasswordResetCode> findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);

    /** Đánh dấu toàn bộ mã chưa dùng của người dùng là đã dùng tại thời điểm được truyền vào. */
    @Modifying
    @Query("update PasswordResetCode code set code.usedAt = :usedAt where code.user = :user and code.usedAt is null")
    int markUnusedCodesAsUsed(@Param("user") User user, @Param("usedAt") LocalDateTime usedAt);
}
