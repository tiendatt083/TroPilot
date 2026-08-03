package com.tropilot.config;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
/**
 * Tạo tài khoản quản trị mặc định khi ứng dụng khởi động lần đầu.
 */
public class AdminAccountSeeder implements CommandLineRunner {

    // Thông tin dùng để khởi tạo hệ thống trống. Mật khẩu được mã hóa trước khi lưu DB.
    private static final String DEFAULT_ADMIN_EMAIL = "tropilot.contact@gmail.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "11111111";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // Nếu đã có quản trị viên, dữ liệu ban đầu đã tồn tại và không cần làm gì thêm.
        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        // Builder giúp tạo đủ các trường bắt buộc của entity User một cách rõ ràng.
        User admin = User.builder()
                .fullName("Property Administrator")
                .email(DEFAULT_ADMIN_EMAIL)
                .phone(null)
                // Tuyệt đối không lưu mật khẩu gốc; Spring Security sẽ lưu chuỗi đã băm.
                .password(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .mustChangePassword(false)
                .build();

        // @Transactional bảo đảm thao tác lưu này thành công hoàn toàn hoặc được rollback.
        userRepository.save(admin);
        log.info("Default admin account created with email {}", DEFAULT_ADMIN_EMAIL);
    }
}
