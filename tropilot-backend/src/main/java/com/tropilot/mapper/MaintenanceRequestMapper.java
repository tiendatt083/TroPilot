package com.tropilot.mapper;

import com.tropilot.dto.response.MaintenanceRequestResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Equipment;
import com.tropilot.entity.MaintenanceRequest;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển yêu cầu bảo trì/sửa chữa thành dữ liệu phản hồi cho API.
 * Mapper xử lý cả yêu cầu gắn với phòng lẫn yêu cầu gắn trực tiếp với tòa nhà hoặc thiết bị.
 */
public class MaintenanceRequestMapper {

    /**
     * Tạo MaintenanceRequestResponse kèm thông tin người gửi, người được giao, phòng, tòa nhà và thiết bị.
     * Khi một quan hệ không tồn tại, các trường tương ứng được trả về null thay vì gây lỗi.
     */
    public MaintenanceRequestResponse toResponse(MaintenanceRequest request) {
        Room room = request.getRoom();
        Building building = request.getBuilding() != null
                ? request.getBuilding()
                : room == null ? null : room.getBuilding();
        User residentHead = request.getResidentHead();
        User requestedBy = request.getRequestedBy() != null
                ? request.getRequestedBy()
                : residentHead;
        User assignedTo = request.getAssignedTo();
        Equipment equipment = request.getEquipment();

        return MaintenanceRequestResponse.builder()
                .id(request.getId())
                .roomId(room == null ? null : room.getId())
                .roomCode(room == null ? null : room.getRoomCode())
                .roomName(room == null ? null : room.getRoomName())
                .buildingId(building == null ? null : building.getId())
                .buildingCode(building == null ? null : building.getBuildingCode())
                .buildingName(building == null ? null : building.getName())
                .residentHeadId(residentHead == null ? null : residentHead.getId())
                .residentHeadName(residentHead == null ? null : residentHead.getFullName())
                .residentHeadEmail(residentHead == null ? null : residentHead.getEmail())
                .requestedById(requestedBy == null ? null : requestedBy.getId())
                .requestedByName(requestedBy == null ? null : requestedBy.getFullName())
                .requestedByEmail(requestedBy == null ? null : requestedBy.getEmail())
                .equipmentId(equipment == null ? null : equipment.getId())
                .equipmentCode(equipment == null ? null : equipment.getEquipmentCode())
                .equipmentName(equipment == null ? null : equipment.getName())
                .title(request.getTitle())
                .content(request.getContent())
                .imageUrl(request.getImageUrl())
                .assignedToId(assignedTo == null ? null : assignedTo.getId())
                .assignedToName(assignedTo == null ? null : assignedTo.getFullName())
                .assignedToEmail(assignedTo == null ? null : assignedTo.getEmail())
                .status(request.getStatus())
                .resultNote(request.getResultNote())
                .resultImageUrl(request.getResultImageUrl())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
