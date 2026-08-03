package com.tropilot.service.impl;

import com.tropilot.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra nội dung email đặt lại mật khẩu và bảo đảm lỗi SMTP không làm đứt luồng nghiệp vụ. */
class PasswordResetEmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendPasswordResetCodeEmailUsesUserEmailAndCode() {
        PasswordResetEmailServiceImpl service = new PasswordResetEmailServiceImpl(mailSender, "", "sender@gmail.com");
        User user = BusinessRuleTestFixtures.residentHead();

        service.sendPasswordResetCodeEmail(user, "123456", LocalDateTime.of(2026, 6, 21, 10, 30));

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(message.getTo()).containsExactly("resident@test.local");
        assertThat(message.getSubject()).isEqualTo("Tropilot - Ma xac nhan dat lai mat khau");
        assertThat(message.getText())
                .contains("Resident Head")
                .contains("123456")
                .contains("21/06/2026 10:30");
    }

    @Test
    void sendPasswordResetCodeEmailDoesNotBreakFlowWhenSmtpFails() {
        PasswordResetEmailServiceImpl service = new PasswordResetEmailServiceImpl(mailSender, "support@tropilot.test", "");
        User user = BusinessRuleTestFixtures.residentHead();

        doThrow(new MailSendException("SMTP unavailable"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        assertThatCode(() -> service.sendPasswordResetCodeEmail(user, "123456", LocalDateTime.now()))
                .doesNotThrowAnyException();
    }
}
