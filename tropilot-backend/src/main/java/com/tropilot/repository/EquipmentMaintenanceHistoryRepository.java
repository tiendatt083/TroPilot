package com.tropilot.repository;

import com.tropilot.entity.EquipmentMaintenanceHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository lưu lịch sử các lần bảo trì của thiết bị.
 * Mỗi lịch sử liên kết với thiết bị, yêu cầu bảo trì nguồn và người thực hiện.
 */
public interface EquipmentMaintenanceHistoryRepository
        extends JpaRepository<EquipmentMaintenanceHistory, Long> {

    /** Kiểm tra một yêu cầu bảo trì đã được ghi nhận thành lịch sử bảo trì hay chưa. */
    boolean existsByMaintenanceRequest_Id(Long maintenanceRequestId);

    /**
     * Lấy lịch sử của một thiết bị, mới nhất trước, đồng thời nạp sẵn các quan hệ cần hiển thị.
     */
    @EntityGraph(attributePaths = {
            "equipment",
            "maintenanceRequest",
            "performedBy"
    })
    List<EquipmentMaintenanceHistory> findByEquipment_IdOrderByMaintenanceDateDescCreatedAtDesc(Long equipmentId);
}
