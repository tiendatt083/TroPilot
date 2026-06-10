package com.tropilot.repository;

import com.tropilot.entity.Equipment;
import com.tropilot.enums.EquipmentCondition;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    boolean existsByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    long countByBuilding_IdAndEquipmentCodeStartingWith(Long buildingId, String equipmentCodePrefix);

    Optional<Equipment> findByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    @Query("""
            select equipment
            from Equipment equipment
            join fetch equipment.building building
            left join fetch equipment.room room
            order by building.buildingCode asc, equipment.scope asc, equipment.name asc
            """)
    List<Equipment> findAllWithBuildingAndRoom();

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
