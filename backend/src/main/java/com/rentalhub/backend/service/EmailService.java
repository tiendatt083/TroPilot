package com.rentalhub.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otp, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText("Chào bạn,\n\nMã OTP của bạn là: " + otp + "\n\nMã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn cho tài khoản.\n\nTrân trọng,\nĐội ngũ HomeNest");
        
        try {
            mailSender.send(message);
            System.out.println("OTP Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP to email: " + toEmail + ". " + e.getMessage());
            // In ra console trong trường hợp chưa config mail đúng
            System.out.println("====== [CONSOLE OTP FALLBACK] ======");
            System.out.println("Mã OTP của " + toEmail + " là: " + otp);
            System.out.println("====================================");
        }
    }
}
