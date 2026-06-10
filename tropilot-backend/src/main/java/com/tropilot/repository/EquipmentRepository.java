package com.tropilot.repository;

import com.tropilot.entity.Equipment;
import com.tropilot.enums.EquipmentCondition;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    boolean existsByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    Optional<Equipment> findByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    @EntityGraph(attributePaths = {"building", "room"})
    List<Equipment> findByBuilding_IdOrderByScopeAscNameAsc(Long buildingId);

    @EntityGraph(attributePaths = {"building", "room"})
    List<Equipment> findByBuilding_IdAndConditionNotOrderByScopeAscNameAsc(
            Long buildingId,
            EquipmentCondition condition
    );

    @Override
    @EntityGraph(attributePaths = {"building", "room"})
    Optional<Equipment> findById(Long id);
}
