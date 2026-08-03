package com.tropilot.service.impl;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.SepayPayment;
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
/** Gửi email phát hành hóa đơn và xác nhận thanh toán sau khi giao dịch được lưu thành công. */
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
    public void sendInvoiceIssuedEmail(Invoice invoice, SepayPayment payment) {
        InvoiceIssuedEmail email = buildInvoiceIssuedEmail(invoice, payment);
        if (email == null) {
            return;
        }

        sendAfterCommit(() -> sendInvoiceIssuedEmailNow(email));
    }

    @Override
    public void sendPaymentSuccessEmail(Invoice invoice, LocalDateTime paidAt) {
        PaymentSuccessEmail email = buildPaymentSuccessEmail(invoice, paidAt);
        if (email == null) {
            return;
        }

        sendAfterCommit(() -> sendPaymentSuccessEmailNow(email));
    }

    private void sendAfterCommit(Runnable sendTask) {
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

    private InvoiceIssuedEmail buildInvoiceIssuedEmail(Invoice invoice, SepayPayment payment) {
        if (invoice == null || invoice.getResidentHead() == null) {
            log.warn("Skipped invoice issued email because invoice or resident head is missing.");
            return null;
        }

        String recipientEmail = clean(invoice.getResidentHead().getEmail());
        if (recipientEmail == null) {
            log.warn("Skipped invoice issued email for invoice {} because resident email is blank.", invoice.getId());
            return null;
        }

        String residentName = clean(invoice.getResidentHead().getFullName());
        String roomCode = invoice.getRoom() == null ? "N/A" : clean(invoice.getRoom().getRoomCode());
        String invoiceMonth = invoice.getMonth() == null ? "N/A" : invoice.getMonth().format(MONTH_FORMATTER);
        String dueDate = invoice.getDueDate() == null ? "N/A" : invoice.getDueDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        BigDecimal totalAmount = invoice.getTotalAmount() == null ? BigDecimal.ZERO : invoice.getTotalAmount();

        return new InvoiceIssuedEmail(
                recipientEmail,
                residentName == null ? "ban" : residentName,
                invoice.getId(),
                roomCode == null ? "N/A" : roomCode,
                invoiceMonth,
                formatAmount(totalAmount),
                dueDate,
                payment == null ? null : clean(payment.getPaymentCode()),
                payment == null ? null : clean(payment.getBankCode()),
                payment == null ? null : clean(payment.getAccountNumber()),
                payment == null ? null : clean(payment.getAccountName())
        );
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

    private void sendInvoiceIssuedEmailNow(InvoiceIssuedEmail email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(email.recipientEmail());
            message.setSubject("Tropilot - Hoa don moi");
            message.setText(buildInvoiceIssuedBody(email));
            mailSender.send(message);
            log.info("Sent invoice issued email for invoice {} to {}.", email.invoiceId(), email.recipientEmail());
        } catch (MailException exception) {
            log.warn(
                    "Failed to send invoice issued email for invoice {} to {}: {}",
                    email.invoiceId(),
                    email.recipientEmail(),
                    exception.getMessage()
            );
        }
    }

    private void sendPaymentSuccessEmailNow(PaymentSuccessEmail email) {
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

    private String buildInvoiceIssuedBody(InvoiceIssuedEmail email) {
        String paymentInstructions = email.paymentCode() == null
                ? "\nVui long dang nhap Tropilot de xem chi tiet thanh toan.\n"
                : """

                        Thong tin chuyen khoan:
                        Ngan hang: %s
                        So tai khoan: %s
                        Chu tai khoan: %s
                        Noi dung chuyen khoan: %s
                        """.formatted(
                        valueOrNotAvailable(email.bankCode()),
                        valueOrNotAvailable(email.accountNumber()),
                        valueOrNotAvailable(email.accountName()),
                        email.paymentCode()
                );

        return """
                Xin chao %s,

                Tropilot da tao hoa don moi cho phong cua ban.

                Phong: %s
                Thang hoa don: %s
                So tien can thanh toan: %s VND
                Han thanh toan: %s
                %s
                Vui long thanh toan dung so tien va noi dung chuyen khoan truoc han.
                Tropilot
                """.formatted(
                email.residentName(),
                email.roomCode(),
                email.invoiceMonth(),
                email.totalAmount(),
                email.dueDate(),
                paymentInstructions
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

    private String valueOrNotAvailable(String value) {
        return value == null ? "N/A" : value;
    }

    private record InvoiceIssuedEmail(
            String recipientEmail,
            String residentName,
            Long invoiceId,
            String roomCode,
            String invoiceMonth,
            String totalAmount,
            String dueDate,
            String paymentCode,
            String bankCode,
            String accountNumber,
            String accountName
    ) {
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
