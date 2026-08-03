package com.tropilot.mapper;

import com.tropilot.dto.response.EquipmentMaintenanceHistoryResponse;
import com.tropilot.dto.response.EquipmentResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.Equipment;
import com.tropilot.entity.EquipmentMaintenanceHistory;
import com.tropilot.entity.Room;
import org.springframework.stereotype.Component;

@Component
/**
 * Chuyển dữ liệu thiết bị và lịch sử bảo trì thiết bị thành các DTO dùng cho API.
 * Đồng thời bổ sung tên, mã tòa nhà hoặc phòng để giao diện hiển thị được ngay.
 */
public class EquipmentMapper {

    /**
     * Chuyển một thiết bị sang dữ liệu phản hồi. Thiết bị dùng chung tòa nhà có thể không thuộc phòng nào,
     * nên các trường thông tin phòng được trả về null trong trường hợp đó.
     */
    public EquipmentResponse toResponse(Equipment equipment) {
        Building building = equipment.getBuilding();
        Room room = equipment.getRoom();

        return EquipmentResponse.builder()
                .id(equipment.getId())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .roomId(room == null ? null : room.getId())
                .roomCode(room == null ? null : room.getRoomCode())
                .roomName(room == null ? null : room.getRoomName())
                .equipmentCode(equipment.getEquipmentCode())
                .name(equipment.getName())
                .scope(equipment.getScope())
                .quantity(equipment.getQuantity())
                .brand(equipment.getBrand())
                .model(equipment.getModel())
                .locationDescription(equipment.getLocationDescription())
                .addedDate(equipment.getAddedDate())
                .installationDate(equipment.getInstallationDate())
                .lastMaintenanceDate(equipment.getLastMaintenanceDate())
                .nextMaintenanceDate(equipment.getNextMaintenanceDate())
                .condition(equipment.getCondition())
                .note(equipment.getNote())
                .createdAt(equipment.getCreatedAt())
                .updatedAt(equipment.getUpdatedAt())
                .build();
    }

    /**
     * Chuyển một lần bảo trì thiết bị sang dữ liệu phản hồi, kèm người thực hiện và yêu cầu bảo trì nguồn.
     */
    public EquipmentMaintenanceHistoryResponse toHistoryResponse(EquipmentMaintenanceHistory history) {
        return EquipmentMaintenanceHistoryResponse.builder()
                .id(history.getId())
                .equipmentId(history.getEquipment().getId())
                .maintenanceRequestId(history.getMaintenanceRequest().getId())
                .maintenanceDate(history.getMaintenanceDate())
                .resultNote(history.getResultNote())
                .resultImageUrl(history.getResultImageUrl())
                .performedById(history.getPerformedBy().getId())
                .performedByName(history.getPerformedBy().getFullName())
                .createdAt(history.getCreatedAt())
                .build();
    }
}
