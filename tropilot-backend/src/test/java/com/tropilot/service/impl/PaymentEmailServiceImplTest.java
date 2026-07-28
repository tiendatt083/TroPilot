package com.tropilot.service.impl;

import com.tropilot.entity.Invoice;
import com.tropilot.entity.Room;
import com.tropilot.entity.SepayPayment;
import com.tropilot.entity.User;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.RoomStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PaymentEmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendInvoiceIssuedEmailUsesResidentEmailAndPaymentDetails() {
        PaymentEmailServiceImpl service = new PaymentEmailServiceImpl(mailSender, "", "sender@gmail.com");
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.UNPAID);
        invoice.setDueDate(java.time.LocalDate.of(2026, 6, 30));
        SepayPayment payment = SepayPayment.builder()
                .paymentCode("TROPILOT300")
                .bankCode("VCB")
                .accountNumber("123456789")
                .accountName("TROPILOT")
                .amount(new BigDecimal("10500000"))
                .build();

        service.sendInvoiceIssuedEmail(invoice, payment);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(message.getTo()).containsExactly("resident@test.local");
        assertThat(message.getSubject()).isEqualTo("Tropilot - Hoa don moi");
        assertThat(message.getText())
                .contains("Resident Head")
                .contains("Phong: BD01-P101")
                .contains("Thang hoa don: 2026-06")
                .contains("So tien can thanh toan: 10,500,000 VND")
                .contains("Han thanh toan: 30/06/2026")
                .contains("Noi dung chuyen khoan: TROPILOT300");
    }

    @Test
    void sendPaymentSuccessEmailUsesResidentEmailAndInvoiceDetails() {
        PaymentEmailServiceImpl service = new PaymentEmailServiceImpl(mailSender, "", "sender@gmail.com");
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.PAID);

        service.sendPaymentSuccessEmail(invoice, LocalDateTime.of(2026, 6, 21, 9, 30));

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(message.getTo()).containsExactly("resident@test.local");
        assertThat(message.getSubject()).isEqualTo("Tropilot - Thanh toan hoa don thanh cong");
        assertThat(message.getText())
                .contains("Resident Head")
                .contains("hoa don #300")
                .contains("Phong: BD01-P101")
                .contains("Thang hoa don: 2026-06")
                .contains("So tien: 10,500,000 VND")
                .contains("Thoi gian ghi nhan: 21/06/2026 09:30");
    }

    @Test
    void sendPaymentSuccessEmailDoesNotBreakPaymentWhenSmtpFails() {
        PaymentEmailServiceImpl service = new PaymentEmailServiceImpl(mailSender, "billing@tropilot.test", "");
        User admin = BusinessRuleTestFixtures.admin();
        User residentHead = BusinessRuleTestFixtures.residentHead();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);
        Invoice invoice = BusinessRuleTestFixtures.invoice(room, residentHead, admin, InvoiceStatus.PAID);

        doThrow(new MailSendException("SMTP unavailable"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        assertThatCode(() -> service.sendPaymentSuccessEmail(invoice, LocalDateTime.now()))
                .doesNotThrowAnyException();
    }
}
