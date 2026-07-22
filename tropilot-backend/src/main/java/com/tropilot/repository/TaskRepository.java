package com.tropilot.repository;

import com.tropilot.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    long countByStatus(com.tropilot.enums.TaskStatus status);

    long countByAssignedTo_IdAndStatusIn(Long assignedToId, Collection<com.tropilot.enums.TaskStatus> statuses);

    long countByAssignedTo_IdAndDeadlineBeforeAndStatusIn(
            Long assignedToId,
            LocalDateTime deadline,
            Collection<com.tropilot.enums.TaskStatus> statuses
    );

    @Query("""
            select case when count(taskEntity) > 0 then true else false end
            from Task taskEntity
            where taskEntity.resultImageUrl in :urls
              and taskEntity.assignedTo.id = :staffId
            """)
    boolean existsByResultImageUrlInAndAssignedToId(
            @Param("urls") Collection<String> urls,
            @Param("staffId") Long staffId
    );

    @Query("""
            select case when count(taskEntity) > 0 then true else false end
            from Task taskEntity
            left join taskEntity.feedback feedback
            left join taskEntity.room room
            where taskEntity.resultImageUrl in :urls
              and (room.id = :roomId or feedback.residentHead.id = :residentHeadId)
            """)
    boolean existsByResultImageUrlInAndResidentAccess(
            @Param("urls") Collection<String> urls,
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    @EntityGraph(attributePaths = {
            "building",
            "room",
            "room.building",
            "feedback",
            "assignedTo",
            "createdBy"
    })
    Optional<Task> findById(Long id);

    @Query("""
            select taskEntity from Task taskEntity
            left join fetch taskEntity.building taskBuilding
            left join fetch taskEntity.room room
            left join fetch room.building building
            left join fetch taskEntity.feedback feedback
            join fetch taskEntity.assignedTo assignedTo
            join fetch taskEntity.createdBy createdBy
            order by taskEntity.createdAt desc
            """)
    List<Task> findAllWithDetails();

    @Query("""
            select taskEntity from Task taskEntity
            left join fetch taskEntity.building taskBuilding
            left join fetch taskEntity.room room
            left join fetch room.building building
            left join fetch taskEntity.feedback feedback
            join fetch taskEntity.assignedTo assignedTo
            join fetch taskEntity.createdBy createdBy
            where taskBuilding.id = :buildingId or building.id = :buildingId
            order by taskEntity.createdAt desc
            """)
    List<Task> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    @Query("""
            select taskEntity from Task taskEntity
            left join fetch taskEntity.building taskBuilding
            left join fetch taskEntity.room room
            left join fetch room.building building
            left join fetch taskEntity.feedback feedback
            join fetch taskEntity.assignedTo assignedTo
            join fetch taskEntity.createdBy createdBy
            where assignedTo.id = :staffId
            order by taskEntity.createdAt desc
            """)
    List<Task> findByAssignedToIdWithDetails(@Param("staffId") Long staffId);
}
