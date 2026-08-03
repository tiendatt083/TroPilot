package com.tropilot.config;

import com.tropilot.entity.User;
import com.tropilot.repository.UserRepository;
import com.tropilot.util.TemporaryPasswordCipher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
/**
 * Kiểm tra tính toàn vẹn của mật khẩu tạm ngay khi khởi động ứng dụng.
 *
 * <p>Một số người dùng buộc đổi mật khẩu đang có mật khẩu tạm được mã hóa trong
 * DB. Nếu encryption secret bị thay đổi, dữ liệu này không thể giải mã. Kiểm tra
 * sớm giúp dừng ứng dụng với thông báo rõ ràng thay vì chỉ phát hiện lỗi khi
 * người dùng cố đăng nhập hoặc đổi mật khẩu.</p>
 */
public class TemporaryPasswordIntegrityValidator implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TemporaryPasswordCipher temporaryPasswordCipher;

    @Override
    @Transactional(readOnly = true)
    public void run(String... args) {
        // Chỉ kiểm tra các tài khoản còn ở trạng thái phải đổi mật khẩu.
        List<User> pendingUsers = userRepository.findAllByMustChangePasswordTrue();

        for (User user : pendingUsers) {
            validateEncryptedPassword(user);
        }

        log.info("Validated {} pending temporary password record(s)", pendingUsers.size());
    }

    private void validateEncryptedPassword(User user) {
        String encryptedPassword = user.getTemporaryPasswordEncrypted();

        // Một tài khoản đang chờ đổi mật khẩu phải luôn có dữ liệu mật khẩu tạm.
        if (encryptedPassword == null || encryptedPassword.isBlank()) {
            throw integrityException(user, null);
        }

        try {
            // Chỉ cần giải mã được là đủ; không sử dụng hay ghi log mật khẩu gốc.
            temporaryPasswordCipher.decrypt(encryptedPassword);
        } catch (IllegalStateException exception) {
            throw integrityException(user, exception);
        }
    }

    private IllegalStateException integrityException(User user, Exception cause) {
        // Kèm ID/email để người vận hành biết chính xác bản ghi nào cần xử lý.
        return new IllegalStateException(
                "Temporary password integrity check failed for user "
                        + user.getId()
                        + " ("
                        + user.getEmail()
                        + "). Restore the configured encryption secret or reset this user's password.",
                cause
        );
    }
}
