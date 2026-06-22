package com.tropilot.mapper;

import com.tropilot.dto.response.TaskResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        Room room = task.getRoom();
        Building building = task.getBuilding();
        if (building == null && room != null) {
            building = room.getBuilding();
        }
        User assignedTo = task.getAssignedTo();
        User createdBy = task.getCreatedBy();

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .content(task.getContent())
                .taskType(task.getTaskType())
                .roomId(room == null ? null : room.getId())
                .roomCode(room == null ? null : room.getRoomCode())
                .roomName(room == null ? null : room.getRoomName())
                .buildingId(building == null ? null : building.getId())
                .buildingCode(building == null ? null : building.getBuildingCode())
                .buildingName(building == null ? null : building.getName())
                .assignedToId(assignedTo.getId())
                .assignedToName(assignedTo.getFullName())
                .assignedToEmail(assignedTo.getEmail())
                .deadline(task.getDeadline())
                .priority(task.getPriority())
                .status(task.getStatus())
                .resultNote(task.getResultNote())
                .resultImageUrl(task.getResultImageUrl())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getFullName())
                .createdByRole(createdBy.getRole().name())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
