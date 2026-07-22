package com.tropilot.service;

import com.tropilot.dto.request.TaskCompleteRequest;
import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.TaskResponse;

import java.util.List;

public interface TaskService {

    TaskResponse createTask(TaskCreateRequest request, Long createdById, Long buildingId);

    List<TaskResponse> getTasks(Long buildingId);

    TaskResponse getTask(Long id, Long buildingId);

    TaskResponse updateTask(Long id, TaskUpdateRequest request, Long buildingId);

    void deleteTask(Long id, Long buildingId);

    List<TaskResponse> getStaffTasks(Long staffId);

    TaskResponse getStaffTask(Long staffId, Long id);

    TaskResponse startTask(Long staffId, Long id);

    TaskResponse completeTask(Long staffId, Long id, TaskCompleteRequest request);
}
