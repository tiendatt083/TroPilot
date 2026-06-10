package com.tropilot.repository;

import com.tropilot.entity.MaintenanceRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {

    long countByStatus(com.tropilot.enums.MaintenanceStatus status);

    long countByAssignedTo_IdAndStatusIn(Long assignedToId, Collection<com.tropilot.enums.MaintenanceStatus> statuses);

    boolean existsByEquipment_Id(Long equipmentId);

    boolean existsByEquipment_IdAndStatusIn(
            Long equipmentId,
            Collection<com.tropilot.enums.MaintenanceStatus> statuses
    );

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "building",
            "residentHead",
            "requestedBy",
            "assignedTo",
            "equipment"
    })
    Optional<MaintenanceRequest> findById(Long id);

    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findAllWithDetails();

    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where directBuilding.id = :buildingId
               or roomBuilding.id = :buildingId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where (room.id = :roomId and residentHead.id = :residentHeadId)
               or (requestedBy.id = :residentHeadId and equipment.id is not null)
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByRoomIdAndResidentHeadIdWithDetails(
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where assignedTo.id = :staffId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByAssignedToIdWithDetails(@Param("staffId") Long staffId);

    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where assignedTo.id = :staffId
              and (directBuilding.id = :buildingId or roomBuilding.id = :buildingId)
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByAssignedToIdAndBuildingIdWithDetails(
            @Param("staffId") Long staffId,
            @Param("buildingId") Long buildingId
    );
}
