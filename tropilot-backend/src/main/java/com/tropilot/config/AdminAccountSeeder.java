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
public class AdminAccountSeeder implements CommandLineRunner {

    private static final String DEFAULT_ADMIN_EMAIL = "admin@tropilot.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@123";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }

        User admin = User.builder()
                .fullName("Property Administrator")
                .email(DEFAULT_ADMIN_EMAIL)
                .phone(null)
                .password(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD))
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .mustChangePassword(false)
                .build();

        userRepository.save(admin);
        log.info("Default admin account created with email {}", DEFAULT_ADMIN_EMAIL);
    }
}
