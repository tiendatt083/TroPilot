package com.tropilot.service.impl;

import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import com.tropilot.enums.RoomStatus;
import com.tropilot.enums.TaskPriority;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.TaskType;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
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
/** Kiểm tra nội dung email giao task và bảo đảm lỗi SMTP không làm hỏng việc tạo task. */
class TaskEmailServiceImplTest {

    @Mock
    private JavaMailSender mailSender;

    @Test
    void sendTaskAssignedEmailUsesAssignedStaffEmailAndTaskDetails() {
        TaskEmailServiceImpl service = new TaskEmailServiceImpl(mailSender, "", "sender@gmail.com");
        Task task = task(staff());

        service.sendTaskAssignedEmail(task);

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage message = messageCaptor.getValue();
        assertThat(message.getFrom()).isEqualTo("sender@gmail.com");
        assertThat(message.getTo()).containsExactly("staff@test.local");
        assertThat(message.getSubject()).isEqualTo("Tropilot - Cong viec moi duoc giao");
        assertThat(message.getText())
                .contains("Staff User")
                .contains("Ma cong viec: #501")
                .contains("Tieu de: Kiem tra phong")
                .contains("Loai cong viec: ROOM_CHECK")
                .contains("Muc uu tien: HIGH")
                .contains("Han xu ly: 22/06/2026 09:00")
                .contains("Toa nha: BD01 - Building 01")
                .contains("Phong: BD01-P101 - Room 101")
                .contains("Nguoi tao: Admin");
    }

    @Test
    void sendTaskAssignedEmailDoesNotBreakTaskCreationWhenSmtpFails() {
        TaskEmailServiceImpl service = new TaskEmailServiceImpl(mailSender, "tasks@tropilot.test", "");
        Task task = task(staff());

        doThrow(new MailSendException("SMTP unavailable"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        assertThatCode(() -> service.sendTaskAssignedEmail(task))
                .doesNotThrowAnyException();
    }

    private Task task(User assignedTo) {
        User admin = BusinessRuleTestFixtures.admin();
        Room room = BusinessRuleTestFixtures.room(RoomStatus.OCCUPIED);

        return Task.builder()
                .id(501L)
                .title("Kiem tra phong")
                .content("Kiem tra tinh trang phong truoc ngay ban giao.")
                .taskType(TaskType.ROOM_CHECK)
                .room(room)
                .assignedTo(assignedTo)
                .deadline(LocalDateTime.of(2026, 6, 22, 9, 0))
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.NEW)
                .createdBy(admin)
                .build();
    }

    private User staff() {
        return User.builder()
                .id(40L)
                .fullName("Staff User")
                .email("staff@test.local")
                .password("hashed")
                .role(UserRole.STAFF)
                .status(UserStatus.ACTIVE)
                .build();
    }
}
