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
public class TemporaryPasswordIntegrityValidator implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TemporaryPasswordCipher temporaryPasswordCipher;

    @Override
    @Transactional(readOnly = true)
    public void run(String... args) {
        List<User> pendingUsers = userRepository.findAllByMustChangePasswordTrue();

        for (User user : pendingUsers) {
            validateEncryptedPassword(user);
        }

        log.info("Validated {} pending temporary password record(s)", pendingUsers.size());
    }

    private void validateEncryptedPassword(User user) {
        String encryptedPassword = user.getTemporaryPasswordEncrypted();

        if (encryptedPassword == null || encryptedPassword.isBlank()) {
            throw integrityException(user, null);
        }

        try {
            temporaryPasswordCipher.decrypt(encryptedPassword);
        } catch (IllegalStateException exception) {
            throw integrityException(user, exception);
        }
    }

    private IllegalStateException integrityException(User user, Exception cause) {
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
