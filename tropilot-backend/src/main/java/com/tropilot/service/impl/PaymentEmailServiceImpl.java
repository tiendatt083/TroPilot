package com.tropilot.service.impl;

import com.tropilot.entity.Invoice;
import com.tropilot.service.PaymentEmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@Slf4j
public class PaymentEmailServiceImpl implements PaymentEmailService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale NUMBER_LOCALE = Locale.US;
    private static final String DEFAULT_FROM_ADDRESS = "no-reply@tropilot.local";

    private final JavaMailSender mailSender;
    private final String configuredFromAddress;
    private final String mailUsername;

    public PaymentEmailServiceImpl(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String configuredFromAddress,
            @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.mailSender = mailSender;
        this.configuredFromAddress = configuredFromAddress;
        this.mailUsername = mailUsername;
    }

    @Override
    public void sendPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt) {
        PaymentSuccessEmail email = buildPaymentSuccessEmail(invoice, paidAt);
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

    private PaymentSuccessEmail buildPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt) {
        if (invoice == null || invoice.getResidentHead() == null) {
            log.warn("Skipped payment success email because invoice or resident head is missing.");
            return null;
        }

        String recipientEmail = clean(invoice.getResidentHead().getEmail());
        if (recipientEmail == null) {
            log.warn("Skipped payment success email for invoice {} because resident email is blank.", invoice.getId());
            return null;
        }

        String residentName = clean(invoice.getResidentHead().getFullName());
        String roomCode = invoice.getRoom() == null ? "N/A" : clean(invoice.getRoom().getRoomCode());
        String invoiceMonth = invoice.getMonth() == null ? "N/A" : invoice.getMonth().format(MONTH_FORMATTER);
        BigDecimal totalAmount = invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount();
        LocalDateTime paymentTime = paidAt == null ? LocalDateTime.now() : paidAt;

        return new PaymentSuccessEmail(
                recipientEmail,
                residentName == null ? "ban" : residentName,
                invoice.getId(),
                roomCode == null ? "N/A" : roomCode,
                invoiceMonth,
                formatAmount(totalAmount),
                paymentTime.format(DATE_TIME_FORMATTER)
        );
    }

    private void sendNow(PaymentSuccessEmail email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(email.recipientEmail());
            message.setSubject("Tropilot - Thanh toan hoa don thanh cong");
            message.setText(buildBody(email));
            mailSender.send(message);
            log.info("Sent payment success email for invoice {} to {}.", email.invoiceId(), email.recipientEmail());
        } catch (MailException exception) {
            log.warn(
                    "Failed to send payment success email for invoice {} to {}: {}",
                    email.invoiceId(),
                    email.recipientEmail(),
                    exception.getMessage()
            );
        }
    }

    private String buildBody(PaymentSuccessEmail email) {
        return """
                Xin chao %s,

                Tropilot da ghi nhan thanh toan thanh cong cho hoa don #%s.

                Phong: %s
                Thang hoa don: %s
                So tien: %s VND
                Thoi gian ghi nhan: %s

                Cam on ban da thanh toan.
                Tropilot
                """.formatted(
                email.residentName(),
                email.invoiceId(),
                email.roomCode(),
                email.invoiceMonth(),
                email.totalAmount(),
                email.paidAt()
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

    private String formatAmount(BigDecimal amount) {
        NumberFormat formatter = NumberFormat.getNumberInstance(NUMBER_LOCALE);
        formatter.setMaximumFractionDigits(0);
        return formatter.format(amount);
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record PaymentSuccessEmail(
            String recipientEmail,
            String residentName,
            Long invoiceId,
            String roomCode,
            String invoiceMonth,
            String totalAmount,
            String paidAt
    ) {
    }
}
