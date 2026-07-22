package com.tropilot.controller;

import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.security.AuthenticatedUser;

import static com.tropilot.security.AuthenticatedUsers.requireUserId;
import com.tropilot.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tasks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaskController {

    private final TaskService taskService;

    @PostMapping
    public ApiResponse<TaskResponse> createTask(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @Valid @RequestBody TaskCreateRequest request
    ) {
        return ApiResponse.success("Task created successfully", taskService.createTask(request, requireUserId(user), buildingId));
    }

    @GetMapping
    public ApiResponse<List<TaskResponse>> getTasks(@RequestParam(name = "buildingId", required = false) Long buildingId) {
        return ApiResponse.success("Tasks loaded successfully", taskService.getTasks(buildingId));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> getTask(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        return ApiResponse.success("Task loaded successfully", taskService.getTask(id, buildingId));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> updateTask(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @Valid @RequestBody TaskUpdateRequest request
    ) {
        return ApiResponse.success("Task updated successfully", taskService.updateTask(id, request, buildingId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTask(
            @PathVariable(name = "id") Long id,
            @RequestParam(name = "buildingId", required = false) Long buildingId
    ) {
        taskService.deleteTask(id, buildingId);
        return ApiResponse.success("Task deleted successfully", null);
    }
}
