package com.tropilot.repository;

import com.tropilot.entity.MaintenanceRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "residentHead",
            "assignedTo"
    })
    Optional<MaintenanceRequest> findById(Long id);

    @Query("""
            select request from MaintenanceRequest request
            join fetch request.room room
            join fetch room.building building
            join fetch request.residentHead residentHead
            left join fetch request.assignedTo assignedTo
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findAllWithDetails();

    @Query("""
            select request from MaintenanceRequest request
            join fetch request.room room
            join fetch room.building building
            join fetch request.residentHead residentHead
            left join fetch request.assignedTo assignedTo
            where room.id = :roomId
              and residentHead.id = :residentHeadId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByRoomIdAndResidentHeadIdWithDetails(
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    @Query("""
            select request from MaintenanceRequest request
            join fetch request.room room
            join fetch room.building building
            join fetch request.residentHead residentHead
            join fetch request.assignedTo assignedTo
            where assignedTo.id = :staffId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByAssignedToIdWithDetails(@Param("staffId") Long staffId);
}
