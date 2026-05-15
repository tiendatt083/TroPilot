package com.tropilot.repository;

import com.tropilot.entity.Task;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "assignedTo",
            "createdBy"
    })
    Optional<Task> findById(Long id);

    @Query("""
            select taskEntity from Task taskEntity
            left join fetch taskEntity.room room
            left join fetch room.building building
            join fetch taskEntity.assignedTo assignedTo
            join fetch taskEntity.createdBy createdBy
            order by taskEntity.createdAt desc
            """)
    List<Task> findAllWithDetails();

    @Query("""
            select taskEntity from Task taskEntity
            left join fetch taskEntity.room room
            left join fetch room.building building
            join fetch taskEntity.assignedTo assignedTo
            join fetch taskEntity.createdBy createdBy
            where assignedTo.id = :staffId
            order by taskEntity.createdAt desc
            """)
    List<Task> findByAssignedToIdWithDetails(@Param("staffId") Long staffId);
}
