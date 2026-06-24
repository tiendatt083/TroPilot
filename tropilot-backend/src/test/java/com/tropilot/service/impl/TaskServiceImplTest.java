package com.tropilot.service.impl;

import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import com.tropilot.enums.TaskPriority;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.TaskType;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.mapper.TaskMapper;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.TaskRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.TaskEmailService;
import com.tropilot.storage.TaskResultImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private BuildingRepository buildingRepository;

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private TaskResultImageStorageService taskResultImageStorageService;

    @Spy
    private TaskMapper taskMapper = new TaskMapper();

    @Mock
    private ActivityLogService activityLogService;

    @Mock
    private TaskEmailService taskEmailService;

    @InjectMocks
    private TaskServiceImpl service;

    @Test
    void createTaskSendsAssignmentEmailToAssignedStaff() {
        User admin = BusinessRuleTestFixtures.admin();
        User staff = staff();
        TaskCreateRequest request = request(staff.getId());

        when(userRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
        when(userRepository.findById(staff.getId())).thenReturn(Optional.of(staff));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(501L);
            return task;
        });

        TaskResponse response = service.createTask(request, admin.getId(), null);

        assertThat(response.getId()).isEqualTo(501L);
        assertThat(response.getAssignedToEmail()).isEqualTo(staff.getEmail());

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskEmailService).sendTaskAssignedEmail(taskCaptor.capture());

        Task emailedTask = taskCaptor.getValue();
        assertThat(emailedTask.getId()).isEqualTo(501L);
        assertThat(emailedTask.getAssignedTo()).isSameAs(staff);
        assertThat(emailedTask.getTitle()).isEqualTo("Kiem tra phong");
        assertThat(emailedTask.getStatus()).isEqualTo(TaskStatus.NEW);
    }

    private TaskCreateRequest request(Long assignedToId) {
        TaskCreateRequest request = new TaskCreateRequest();
        request.setTitle("Kiem tra phong");
        request.setContent("Kiem tra tinh trang phong truoc ngay ban giao.");
        request.setTaskType(TaskType.ROOM_CHECK.name());
        request.setAssignedToId(assignedToId);
        request.setDeadline(LocalDateTime.of(2026, 6, 22, 9, 0));
        request.setPriority(TaskPriority.HIGH.name());
        return request;
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
