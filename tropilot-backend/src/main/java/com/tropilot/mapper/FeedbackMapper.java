package com.tropilot.mapper;

import com.tropilot.dto.response.FeedbackResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Feedback;
import com.tropilot.entity.Invoice;
import com.tropilot.entity.Room;
import com.tropilot.entity.Task;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
/**
 * Chuyển phản hồi/kiến nghị của cư dân sang dữ liệu trả về cho API.
 * Kết quả bao gồm ngữ cảnh phòng, hóa đơn (nếu có), người trả lời và công việc xử lý mới nhất.
 */
public class FeedbackMapper {

    /**
     * Ghép các quan hệ của Feedback thành FeedbackResponse để client có đủ thông tin hiển thị chi tiết.
     */
    public FeedbackResponse toResponse(Feedback feedback) {
        User residentHead = feedback.getResidentHead();
        Room room = feedback.getRoom();
        Building building = room.getBuilding();
        Invoice invoice = feedback.getInvoice();
        User repliedBy = feedback.getRepliedBy();
        Task assignedTask = latestTask(feedback.getTasks());
        User assignedStaff = assignedTask == null ? null : assignedTask.getAssignedTo();

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .invoiceId(invoice == null ? null : invoice.getId())
                .invoiceMonth(invoice == null ? null : invoice.getMonth())
                .invoiceTotalAmount(invoice == null ? null : invoice.getTotalAmount())
                .type(feedback.getType())
                .title(feedback.getTitle())
                .content(feedback.getContent())
                .status(feedback.getStatus())
                .reply(feedback.getReply())
                .repliedById(repliedBy == null ? null : repliedBy.getId())
                .repliedByName(repliedBy == null ? null : repliedBy.getFullName())
                .repliedByRole(repliedBy == null ? null : repliedBy.getRole().name())
                .assignedTaskId(assignedTask == null ? null : assignedTask.getId())
                .assignedTaskStatus(assignedTask == null ? null : assignedTask.getStatus())
                .assignedStaffId(assignedStaff == null ? null : assignedStaff.getId())
                .assignedStaffName(assignedStaff == null ? null : assignedStaff.getFullName())
                .assignedTaskUpdatedAt(assignedTask == null ? null : assignedTask.getUpdatedAt())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    /**
     * Chọn task được tạo mới nhất trong danh sách task gắn với phản hồi.
     * Nếu chưa tạo task xử lý thì trả về null.
     */
    private Task latestTask(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return null;
        }

        return tasks.stream()
                .max(Comparator
                        .comparing(Task::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(Task::getId, Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }
}
