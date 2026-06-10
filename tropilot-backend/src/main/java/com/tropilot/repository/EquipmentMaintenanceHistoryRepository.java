package com.tropilot.repository;

import com.tropilot.entity.EquipmentMaintenanceHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentMaintenanceHistoryRepository
        extends JpaRepository<EquipmentMaintenanceHistory, Long> {

    boolean existsByMaintenanceRequest_Id(Long maintenanceRequestId);

    @EntityGraph(attributePaths = {
            "equipment",
            "maintenanceRequest",
            "performedBy"
    })
    List<EquipmentMaintenanceHistory> findByEquipment_IdOrderByMaintenanceDateDescCreatedAtDesc(Long equipmentId);
}
