package com.tropilot.service.impl;

import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import com.tropilot.service.TaskEmailService;
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
public class TaskEmailServiceImpl implements TaskEmailService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final String DEFAULT_FROM_ADDRESS = "no-reply@tropilot.local";

    private final JavaMailSender mailSender;
    private final String configuredFromAddress;
    private final String mailUsername;

    public TaskEmailServiceImpl(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String configuredFromAddress,
            @Value("${spring.mail.username:}") String mailUsername
    ) {
        this.mailSender = mailSender;
        this.configuredFromAddress = configuredFromAddress;
        this.mailUsername = mailUsername;
    }

    @Override
    public void sendTaskAssignedEmail(Task task) {
        TaskAssignedEmail email = buildTaskAssignedEmail(task);
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

    private TaskAssignedEmail buildTaskAssignedEmail(Task task) {
        if (task == null || task.getAssignedTo() == null) {
            log.warn("Skipped task assignment email because task or assigned staff is missing.");
            return null;
        }

        User assignedTo = task.getAssignedTo();
        String recipientEmail = clean(assignedTo.getEmail());
        if (recipientEmail == null) {
            log.warn("Skipped task assignment email for task {} because staff email is blank.", task.getId());
            return null;
        }

        Room room = task.getRoom();
        Building building = room == null ? null : room.getBuilding();
        String roomLabel = room == null ? "Khong gan phong cu the" : room.getRoomCode() + " - " + room.getRoomName();
        String buildingLabel = building == null
                ? "Khong gan toa nha cu the"
                : building.getBuildingCode() + " - " + building.getName();
        LocalDateTime deadline = task.getDeadline();

        return new TaskAssignedEmail(
                recipientEmail,
                clean(assignedTo.getFullName()) == null ? "nhan vien" : clean(assignedTo.getFullName()),
                task.getId(),
                clean(task.getTitle()),
                clean(task.getContent()),
                task.getTaskType() == null ? "N/A" : task.getTaskType().name(),
                task.getPriority() == null ? "N/A" : task.getPriority().name(),
                deadline == null ? "Chua cung cap" : deadline.format(DATE_TIME_FORMATTER),
                buildingLabel,
                roomLabel,
                task.getCreatedBy() == null ? "He thong" : clean(task.getCreatedBy().getFullName())
        );
    }

    private void sendNow(TaskAssignedEmail email) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(resolveFromAddress());
            message.setTo(email.recipientEmail());
            message.setSubject("Tropilot - Cong viec moi duoc giao");
            message.setText(buildBody(email));
            mailSender.send(message);
            log.info("Sent task assignment email for task {} to {}.", email.taskId(), email.recipientEmail());
        } catch (MailException exception) {
            log.warn(
                    "Failed to send task assignment email for task {} to {}: {}",
                    email.taskId(),
                    email.recipientEmail(),
                    exception.getMessage()
            );
        }
    }

    private String buildBody(TaskAssignedEmail email) {
        return """
                Xin chao %s,

                Tropilot thong bao ban vua duoc giao mot cong viec moi.

                Ma cong viec: #%s
                Tieu de: %s
                Noi dung: %s
                Loai cong viec: %s
                Muc uu tien: %s
                Han xu ly: %s
                Toa nha: %s
                Phong: %s
                Nguoi tao: %s

                Vui long dang nhap Tropilot de xem chi tiet va cap nhat tien do.
                Tropilot
                """.formatted(
                email.staffName(),
                email.taskId(),
                fallback(email.title()),
                fallback(email.content()),
                email.taskType(),
                email.priority(),
                email.deadline(),
                email.buildingLabel(),
                email.roomLabel(),
                fallback(email.createdByName())
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

    private String fallback(String value) {
        String cleaned = clean(value);
        return cleaned == null ? "Chua cung cap" : cleaned;
    }

    private record TaskAssignedEmail(
            String recipientEmail,
            String staffName,
            Long taskId,
            String title,
            String content,
            String taskType,
            String priority,
            String deadline,
            String buildingLabel,
            String roomLabel,
            String createdByName
    ) {
    }
}
