package com.tropilot.mapper;

import com.tropilot.dto.response.TaskResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển công việc được giao cho nhân viên thành TaskResponse.
 * Mapper đưa vào ngữ cảnh phòng/tòa nhà, phản hồi nguồn (nếu có), người được giao và người tạo công việc.
 */
public class TaskMapper {

    /**
     * Tạo dữ liệu công việc để hiển thị. Nếu task không gắn trực tiếp với tòa nhà,
     * mapper lấy tòa nhà từ phòng mà task đang gắn tới.
     */
    public TaskResponse toResponse(Task task) {
        Room room = task.getRoom();
        Building building = task.getBuilding();
        if (building == null && room != null) {
            building = room.getBuilding();
        }
        Feedback feedback = task.getFeedback();
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
                .feedbackId(feedback == null ? null : feedback.getId())
                .feedbackTitle(feedback == null ? null : feedback.getTitle())
                .feedbackStatus(feedback == null ? null : feedback.getStatus())
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
