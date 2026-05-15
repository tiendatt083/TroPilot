package com.tropilot.service;

import com.tropilot.dto.request.TaskCompleteRequest;
import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskRejectRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.TaskResponse;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(TaskCreateRequest request, Long createdById);

    List<TaskResponse> getTasks();

    TaskResponse getTask(Long id);

    TaskResponse updateTask(Long id, TaskUpdateRequest request);

    List<TaskResponse> getStaffTasks(Long staffId);

    TaskResponse getStaffTask(Long staffId, Long id);

    TaskResponse startTask(Long staffId, Long id);

    TaskResponse completeTask(Long staffId, Long id, TaskCompleteRequest request);

    TaskResponse rejectTask(Long staffId, Long id, TaskRejectRequest request);
}
