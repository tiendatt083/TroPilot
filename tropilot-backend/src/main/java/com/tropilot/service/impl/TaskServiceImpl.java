package com.tropilot.service.impl;

import com.tropilot.storage.TaskResultImageStorageService;
import com.tropilot.mapper.TaskMapper;
import com.tropilot.dto.request.TaskCompleteRequest;
import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import com.tropilot.enums.FeedbackStatus;
import com.tropilot.enums.NotificationEventType;
import com.tropilot.enums.TaskPriority;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.TaskType;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.exception.ForbiddenException;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.RoomRepository;
import com.tropilot.repository.BuildingRepository;
import com.tropilot.repository.FeedbackRepository;
import com.tropilot.repository.TaskRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.TaskEmailService;
import com.tropilot.service.TaskService;
import com.tropilot.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
/** Điều phối vòng đời task: tạo, gán người, cập nhật, hoàn thành và đồng bộ trạng thái phản hồi liên quan. */
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final BuildingRepository buildingRepository;
    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final TaskResultImageStorageService taskResultImageStorageService;
    private final TaskMapper taskMapper;
    private final ActivityLogService activityLogService;
    private final TaskEmailService taskEmailService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    /** Tạo task, kiểm tra người được giao/phòng/phản hồi nguồn và gửi thông báo hoặc email phân công. */
    public TaskResponse createTask(TaskCreateRequest request, Long createdById, Long buildingId) {
        User createdBy = findUser(createdById);
        User assignedTo = findActiveStaff(request.getAssignedToId());
        Feedback feedback = resolveFeedback(request.getFeedbackId(), buildingId);
        Room room = resolveTaskRoom(request.getRoomId(), feedback);
        Building building = resolveTaskBuilding(room, buildingId, null);

        Task task = Task.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .taskType(parseTaskType(request.getTaskType()))
                .building(building)
                .room(room)
                .feedback(feedback)
                .assignedTo(assignedTo)
                .deadline(request.getDeadline())
                .priority(parseTaskPriority(request.getPriority()))
                .status(TaskStatus.NEW)
                .createdBy(createdBy)
                .build();

        Task savedTask = taskRepository.save(task);
        synchronizeFeedbackStatus(savedTask);
        activityLogService.record(
                createdBy,
                "TASK_CREATED",
                "Created task " + savedTask.getTitle() + " for " + assignedTo.getEmail()
        );
        notificationService.notifyUser(
                createdBy,
                assignedTo,
                NotificationEventType.TASK_ASSIGNED,
                "Bạn có công việc mới",
                savedTask.getTitle() + " - hạn hoàn thành " + savedTask.getDeadline().toLocalDate(),
                "/staff/tasks/" + savedTask.getId(),
                savedTask.getBuilding()
        );
        taskEmailService.sendTaskAssignedEmail(savedTask);

        return taskMapper.toResponse(savedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasks(Long buildingId) {
        List<Task> tasks = buildingId == null
                ? taskRepository.findAllWithDetails()
                : getBuildingTasks(buildingId);

        return tasks
                .stream()
                .map(taskMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id, Long buildingId) {
        Task task = findTask(id);
        validateTaskBelongsToBuilding(task, buildingId);

        return taskMapper.toResponse(task);
    }

    @Override
    @Transactional
    /** Cập nhật task trong phạm vi tòa nhà và đồng bộ trạng thái phản hồi nếu task gắn với phản hồi cư dân. */
    public TaskResponse updateTask(Long id, TaskUpdateRequest request, Long buildingId) {
        Task task = findTask(id);
        User assignedTo = findActiveStaff(request.getAssignedToId());
        Room room = request.getRoomId() == null
                ? linkedFeedbackRoom(task)
                : findRoom(request.getRoomId());
        validateTaskBelongsToBuilding(task, buildingId);
        Building building = resolveTaskBuilding(room, buildingId, task.getBuilding());

        task.setTitle(request.getTitle().trim());
        task.setContent(request.getContent().trim());
        task.setTaskType(parseTaskType(request.getTaskType()));
        task.setBuilding(building);
        task.setRoom(room);
        validateLinkedFeedbackRoom(task, room);
        task.setAssignedTo(assignedTo);
        task.setDeadline(request.getDeadline());
        task.setPriority(parseTaskPriority(request.getPriority()));
        task.setStatus(parseTaskStatus(request.getStatus()));

        Task savedTask = taskRepository.save(task);
        synchronizeFeedbackStatus(savedTask);

        return taskMapper.toResponse(savedTask);
    }

    @Override
    @Transactional
    public void deleteTask(Long id, Long buildingId) {
        Task task = findTask(id);
        validateTaskBelongsToBuilding(task, buildingId);

        if (task.getStatus() == TaskStatus.IN_PROGRESS || task.getStatus() == TaskStatus.COMPLETED) {
            throw new BadRequestException("Tasks already updated by staff cannot be deleted");
        }

        Feedback feedback = task.getFeedback();
        if (feedback != null && feedback.getStatus() == FeedbackStatus.IN_PROGRESS) {
            feedback.setStatus(FeedbackStatus.PENDING);
            feedbackRepository.save(feedback);
        }

        taskRepository.delete(task);
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
    /** Nhân viên bắt đầu task đã được giao cho mình. */
    public TaskResponse startTask(Long staffId, Long id) {
        Task task = findAssignedTask(staffId, id);

        if (task.getStatus() != TaskStatus.NEW) {
            throw new BadRequestException("Only new tasks can be started");
        }

        task.setStatus(TaskStatus.IN_PROGRESS);
        Task savedTask = taskRepository.save(task);
        synchronizeFeedbackStatus(savedTask);
        activityLogService.record(
                savedTask.getAssignedTo(),
                "TASK_STARTED",
                "Started task " + savedTask.getTitle()
        );

        return taskMapper.toResponse(savedTask);
    }

    @Override
    @Transactional
    /** Nhân viên hoàn thành task, lưu kết quả/ảnh và đồng bộ thông báo cho cư dân nếu cần. */
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

        Task savedTask = taskRepository.save(task);
        synchronizeFeedbackStatus(savedTask);
        activityLogService.record(
                savedTask.getAssignedTo(),
                "TASK_COMPLETED",
                "Completed task " + savedTask.getTitle()
        );
        notifyTaskCreator(
                savedTask,
                NotificationEventType.TASK_COMPLETED,
                "Nhân viên đã hoàn thành công việc",
                savedTask.getAssignedTo().getFullName()
                        + " đã hoàn thành công việc \"" + savedTask.getTitle() + "\"."
        );
        notifyFeedbackResident(
                savedTask,
                "Yêu cầu của bạn đã được xử lý",
                "Công việc liên quan đến phản hồi \"" + linkedFeedbackTitle(savedTask) + "\" đã hoàn thành."
        );

        return taskMapper.toResponse(savedTask);
    }

    private void notifyTaskCreator(
            Task task,
            NotificationEventType eventType,
            String title,
            String content
    ) {
        notificationService.notifyUser(
                task.getAssignedTo(),
                task.getCreatedBy(),
                eventType,
                title,
                content,
                adminTaskPath(task),
                task.getBuilding()
        );
    }

    private void notifyFeedbackResident(Task task, String title, String content) {
        if (task.getFeedback() == null) {
            return;
        }

        notificationService.notifyUser(
                task.getAssignedTo(),
                task.getFeedback().getResidentHead(),
                NotificationEventType.FEEDBACK_UPDATED,
                title,
                content,
                "/resident/feedbacks",
                task.getFeedback().getRoom().getBuilding()
        );
    }

    private String adminTaskPath(Task task) {
        return task.getBuilding() == null
                ? "/admin/tasks/" + task.getId()
                : "/admin/buildings/" + task.getBuilding().getId() + "/tasks/" + task.getId();
    }

    private String linkedFeedbackTitle(Task task) {
        return task.getFeedback() == null ? task.getTitle() : task.getFeedback().getTitle();
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

    private List<Task> getBuildingTasks(Long buildingId) {
        validateBuildingExists(buildingId);
        return taskRepository.findByBuildingIdWithDetails(buildingId);
    }

    private void validateBuildingExists(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("Building not found");
        }
    }

    private Building resolveTaskBuilding(Room room, Long buildingId, Building fallbackBuilding) {
        if (buildingId != null) {
            Building building = findBuilding(buildingId);
            validateRoomBelongsToBuilding(room, building);
            return building;
        }

        if (room != null) {
            return room.getBuilding();
        }

        return fallbackBuilding;
    }

    private Feedback resolveFeedback(Long feedbackId, Long buildingId) {
        if (feedbackId == null) {
            return null;
        }

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback not found"));
        validateFeedbackBelongsToBuilding(feedback, buildingId);

        if (feedback.getStatus() == FeedbackStatus.RESOLVED) {
            throw new BadRequestException("Resolved feedback cannot be assigned to staff");
        }

        return feedback;
    }

    private Room resolveTaskRoom(Long roomId, Feedback feedback) {
        Room room = roomId == null ? null : findRoom(roomId);

        if (feedback == null) {
            return room;
        }

        Room feedbackRoom = feedback.getRoom();
        if (room != null && !Objects.equals(room.getId(), feedbackRoom.getId())) {
            throw new BadRequestException("Task room must match the feedback room");
        }

        return feedbackRoom;
    }

    private Room linkedFeedbackRoom(Task task) {
        return task.getFeedback() == null ? null : task.getFeedback().getRoom();
    }

    private void validateRoomBelongsToBuilding(Room room, Building building) {
        if (room == null || building == null) {
            return;
        }

        if (!Objects.equals(room.getBuilding().getId(), building.getId())) {
            throw new BadRequestException("Task room does not belong to the selected building");
        }
    }

    private void validateLinkedFeedbackRoom(Task task, Room room) {
        Feedback feedback = task.getFeedback();
        if (feedback == null || room == null) {
            return;
        }

        if (!Objects.equals(feedback.getRoom().getId(), room.getId())) {
            throw new BadRequestException("Task room must match the linked feedback room");
        }
    }

    private void validateFeedbackBelongsToBuilding(Feedback feedback, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        if (!Objects.equals(feedback.getRoom().getBuilding().getId(), buildingId)) {
            throw new BadRequestException("Feedback does not belong to the selected building");
        }
    }

    private void validateTaskBelongsToBuilding(Task task, Long buildingId) {
        if (buildingId == null) {
            return;
        }

        validateBuildingExists(buildingId);

        Long taskBuildingId = task.getBuilding() == null ? null : task.getBuilding().getId();
        if (taskBuildingId == null && task.getRoom() != null) {
            taskBuildingId = task.getRoom().getBuilding().getId();
        }

        if (!Objects.equals(taskBuildingId, buildingId)) {
            throw new BadRequestException("Task does not belong to the selected building");
        }
    }

    private void synchronizeFeedbackStatus(Task task) {
        Feedback feedback = task.getFeedback();
        if (feedback == null) {
            return;
        }

        FeedbackStatus status = switch (task.getStatus()) {
            case NEW, IN_PROGRESS, OVERDUE -> FeedbackStatus.IN_PROGRESS;
            case COMPLETED, REJECTED -> FeedbackStatus.RESOLVED;
        };

        if (feedback.getStatus() != status) {
            feedback.setStatus(status);
            feedbackRepository.save(feedback);
        }
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Building not found"));
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
            TaskStatus status = TaskStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
            if (status == TaskStatus.REJECTED) {
                throw new BadRequestException("Task status is invalid");
            }
            return status;
        } catch (RuntimeException exception) {
            throw new BadRequestException("Task status is invalid");
        }
    }
}
