package com.tropilot.repository;

import com.tropilot.entity.Notification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {
            "createdBy",
            "targetUsers",
            "targetUsers.user",
            "targetBuildings",
            "targetBuildings.building"
    })
    Optional<Notification> findById(Long id);

    @EntityGraph(attributePaths = {
            "createdBy",
            "targetUsers",
            "targetUsers.user",
            "targetBuildings",
            "targetBuildings.building"
    })
    List<Notification> findAllByOrderByCreatedAtDesc();
}
