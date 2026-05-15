package com.tropilot.dto.response;

import com.tropilot.enums.TaskPriority;
import com.tropilot.enums.TaskStatus;
import com.tropilot.enums.TaskType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String content;
    private TaskType taskType;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private Long buildingId;
    private String buildingCode;
    private String buildingName;
    private Long assignedToId;
    private String assignedToName;
    private String assignedToEmail;
    private LocalDateTime deadline;
    private TaskPriority priority;
    private TaskStatus status;
    private String resultNote;
    private String resultImageUrl;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
