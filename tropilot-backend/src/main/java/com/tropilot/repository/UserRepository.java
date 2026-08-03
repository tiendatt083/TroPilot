package com.tropilot.repository;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý tài khoản người dùng và các truy vấn xác thực/phân quyền cơ bản.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /** Tìm tài khoản theo email, thường dùng khi đăng nhập hoặc kiểm tra email trùng. */
    Optional<User> findByEmail(String email);

    /** Kiểm tra hệ thống có ít nhất một tài khoản thuộc vai trò được truyền vào hay không. */
    boolean existsByRole(UserRole role);

    /** Đếm số tài khoản thuộc một vai trò. */
    long countByRole(UserRole role);

    /** Lấy tất cả tài khoản theo thời điểm tạo giảm dần. */
    List<User> findAllByOrderByCreatedAtDesc();

    /** Lấy các tài khoản vẫn đang bắt buộc đổi mật khẩu tạm. */
    List<User> findAllByMustChangePasswordTrue();

    /** Lấy tài khoản theo đồng thời vai trò và trạng thái hoạt động. */
    List<User> findByRoleAndStatus(UserRole role, UserStatus status);
}
