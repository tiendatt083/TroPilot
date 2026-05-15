package com.tropilot.controller;

import com.tropilot.dto.request.TaskCreateRequest;
import com.tropilot.dto.request.TaskUpdateRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
            @Valid @RequestBody TaskCreateRequest request
    ) {
        return ApiResponse.success("Task created successfully", taskService.createTask(request, getUserId(user)));
    }

    @GetMapping
    public ApiResponse<List<TaskResponse>> getTasks() {
        return ApiResponse.success("Tasks loaded successfully", taskService.getTasks());
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> getTask(@PathVariable Long id) {
        return ApiResponse.success("Task loaded successfully", taskService.getTask(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request
    ) {
        return ApiResponse.success("Task updated successfully", taskService.updateTask(id, request));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
