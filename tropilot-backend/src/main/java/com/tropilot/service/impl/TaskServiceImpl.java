package com.tropilot.service.impl;

import com.tropilot.dto.request.TaskCompleteRequest;
import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskRejectRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import com.tropilot.enums.TaskPriority;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.TaskType;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.TaskRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final TaskResultImageStorageService taskResultImageStorageService;
    private final TaskMapper taskMapper;

    @Override
    @Transactional
    public TaskResponse createTask(TaskCreateRequest request, Long createdById) {
        User createdBy = findUser(createdById);
        User assignedTo = findActiveStaff(request.getAssignedToId());
        Room room = request.getRoomId() == null ? null : findRoom(request.getRoomId());

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .taskType(parseTaskType(request.getTaskType()))
                .room(room)
                .assignedTo(assignedTo)
                .deadline(request.getDeadline())
                .priority(parseTaskPriority(request.getPriority()))
                .status(TaskStatus.NEW)
                .createdBy(createdBy)
                .build();

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks() {
        return taskRepository.findAllWithDetails()
                .stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) {
        return taskMapper.toResponse(findTask(id));
    }

    @Override
    @Transactional
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        Task task = findTask(id);
        User assignedTo = findActiveStaff(request.getAssignedToId());
        Room room = request.getRoomId() == null ? null : findRoom(request.getRoomId());

        task.setTitle(request.getTitle().trim());
        task.setContent(request.getContent().trim());
        task.setTaskType(parseTaskType(request.getTaskType()));
        task.setRoom(room);
        task.setAssignedTo(assignedTo);
        task.setDeadline(request.getDeadline());
        task.setPriority(parseTaskPriority(request.getPriority()));
        task.setStatus(parseTaskStatus(request.getStatus()));

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getStaffTasks(Long staffId) {
        return taskRepository.findByAssignedToIdWithDetails(staffId)
                .stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getStaffTask(Long staffId, Long id) {
        return taskMapper.toResponse(findAssignedTask(staffId, id));
    }

    @Override
    @Transactional
    public TaskResponse startTask(Long staffId, Long id) {
        Task task = findAssignedTask(staffId, id);

        if (task.getStatus() != TaskStatus.NEW) {
            throw new BadRequestException("Only new tasks can be started");
        }

        task.setStatus(TaskStatus.IN_PROGRESS);
        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse completeTask(Long staffId, Long id, TaskCompleteRequest request) {
        Task task = findAssignedTask(staffId, id);

        if (task.getStatus() != TaskStatus.IN_PROGRESS) {
            throw new BadRequestException("Only in-progress tasks can be completed");
        }

        String resultImageUrl = taskResultImageStorageService.store(request.getResultImage());
        task.setStatus(TaskStatus.COMPLETED);
        task.setResultNote(request.getResultNote().trim());

        if (resultImageUrl != null) {
            task.setResultImageUrl(resultImageUrl);
        }

        return taskMapper.toResponse(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse rejectTask(Long staffId, Long id, TaskRejectRequest request) {
        Task task = findAssignedTask(staffId, id);

        if (task.getStatus() == TaskStatus.COMPLETED) {
            throw new BadRequestException("Completed tasks cannot be rejected");
        }

        task.setStatus(TaskStatus.REJECTED);
        if (request != null && request.getResultNote() != null && !request.getResultNote().isBlank()) {
            task.setResultNote(request.getResultNote().trim());
        }

        return taskMapper.toResponse(taskRepository.save(task));
    }

    private Task findAssignedTask(Long staffId, Long id) {
        Task task = findTask(id);

        if (!task.getAssignedTo().getId().equals(staffId)) {
            throw new ForbiddenException("Task is not assigned to the current staff user");
        }

        return task;
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    private Room findRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private User findActiveStaff(Long userId) {
        User user = findUser(userId);

        if (user.getRole() != UserRole.STAFF) {
            throw new BadRequestException("Assigned user must be a staff user");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Assigned staff account must be active");
        }

        return user;
    }

    private TaskType parseTaskType(String value) {
        try {
            return TaskType.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Task type is invalid");
        }
    }

    private TaskPriority parseTaskPriority(String value) {
        try {
            return TaskPriority.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Task priority is invalid");
        }
    }

    private TaskStatus parseTaskStatus(String value) {
        try {
            return TaskStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (RuntimeException exception) {
            throw new BadRequestException("Task status is invalid");
        }
    }
}
