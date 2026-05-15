package com.tropilot.repository;

import com.tropilot.entity.ActivityLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findByActionContainingIgnoreCaseOrderByCreatedAtDesc(String action);

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findByUser_IdAndActionContainingIgnoreCaseOrderByCreatedAtDesc(Long userId, String action);
}
