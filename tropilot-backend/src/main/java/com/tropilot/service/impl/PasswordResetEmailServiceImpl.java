package com.tropilot.service.impl;

import com.tropilot.entity.User;
import com.tropilot.service.PasswordResetEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PasswordResetEmailServiceImpl implements PasswordResetEmailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String DEFAULT_FROM_ADDRESS = "no-reply@tropilot.local";

    private final JavaMailSender mailSender;
    private final String configuredFromAddress;
    private final String mailUsername;

    public PasswordResetEmailServiceImpl(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String configuredFromAddress,
            @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.mailSender = mailSender;
        this.configuredFromAddress = configuredFromAddress;
        this.mailUsername = mailUsername;
    }

    @Override
    public void sendPasswordResetCodeEmail(User user, String code, LocalDateTime expiresAt) {
        PasswordResetEmail email = buildPasswordResetEmail(user, code, expiresAt);
        if (email == null) {
            return;
        }

        Runnable sendTask = () -> sendNow(email);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendTask.run();
                }
            });
            return;
        }

        sendTask.run();
    }

    private PasswordResetEmail buildPasswordResetEmail(User user, String code, LocalDateTime expiresAt) {
        if (user == null) {
            log.warn("Skipped password reset email because user is missing.");
            return null;
        }

        String recipientEmail = clean(user.getEmail());
        if (recipientEmail == null) {
            log.warn("Skipped password reset email for user {} because email is blank.", user.getId());
            return null;
        }

        String recipientName = clean(user.getFullName());
        LocalDateTime expiryTime = expiresAt == null ? LocalDateTime.now().plusMinutes(10) : expiresAt;

        return new PasswordResetEmail(
                recipientEmail,
                recipientName == null ? "ban" : recipientName,
                code,
                expiryTime.format(DATE_TIME_FORMATTER)
        );
    }

    private void sendNow(PasswordResetEmail email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(email.recipientEmail());
            message.setSubject("Tropilot - Ma xac nhan dat lai mat khau");
            message.setText(buildBody(email));
            mailSender.send(message);
            log.info("Sent password reset code email to {}.", email.recipientEmail());
        } catch (MailException exception) {
            log.warn(
                    "Failed to send password reset code email to {}: {}",
                    email.recipientEmail(),
                    exception.getMessage()
            );
        }
    }

    private String buildBody(PasswordResetEmail email) {
        return """
                Xin chao %s,

                Ma xac nhan dat lai mat khau Tropilot cua ban la:

                %s

                Ma nay co hieu luc den %s va chi dung duoc mot lan.
                Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.

                Tropilot
                """.formatted(
                email.recipientName(),
                email.code(),
                email.expiresAt()
        );
    }

    private String resolveFromAddress() {
        String fromAddress = clean(configuredFromAddress);
        if (fromAddress != null) {
            return fromAddress;
        }

        String username = clean(mailUsername);
        return username == null ? DEFAULT_FROM_ADDRESS : username;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record PasswordResetEmail(
            String recipientEmail,
            String recipientName,
            String code,
            String expiresAt
    ) {
    }
}
