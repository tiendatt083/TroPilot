package com.tropilot.controller;

import com.tropilot.dto.request.TaskCompleteRequest;
import com.tropilot.dto.request.TaskRejectRequest;
import com.tropilot.dto.response.ApiResponse;
import com.tropilot.dto.response.TaskResponse;
import com.tropilot.exception.UnauthorizedException;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/staff/tasks")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STAFF')")
public class StaffTaskController {

    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<TaskResponse>> getTasks(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success("Tasks loaded successfully", taskService.getStaffTasks(getUserId(user)));
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> getTask(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success("Task loaded successfully", taskService.getStaffTask(getUserId(user), id));
    }

    @PutMapping("/{id}/start")
    public ApiResponse<TaskResponse> startTask(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id
    ) {
        return ApiResponse.success("Task started successfully", taskService.startTask(getUserId(user), id));
    }

    @PutMapping(path = "/{id}/complete", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TaskResponse> completeTask(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @ModelAttribute TaskCompleteRequest request
    ) {
        return ApiResponse.success("Task completed successfully", taskService.completeTask(getUserId(user), id, request));
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<TaskResponse> rejectTask(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody(required = false) TaskRejectRequest request
    ) {
        return ApiResponse.success("Task rejected successfully", taskService.rejectTask(getUserId(user), id, request));
    }

    private Long getUserId(AuthenticatedUser user) {
        if (user == null) {
            throw new UnauthorizedException("Authentication is required");
        }

        return user.getId();
    }
}
