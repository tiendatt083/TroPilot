package com.tropilot.repository;

import com.tropilot.entity.Notification;
import com.tropilot.enums.NotificationTargetType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = "createdBy")
    Optional<Notification> findById(Long id);

    @Query("""
            select notification from Notification notification
            join fetch notification.createdBy createdBy
            where notification.targetType in :globalTargets
               or (notification.targetType = :oneUserTarget and notification.targetId = :userId)
               or (:roomId is not null and notification.targetType = :oneRoomTarget and notification.targetId = :roomId)
            order by notification.createdAt desc
            """)
    List<Notification> findVisibleNotifications(
            @Param("globalTargets") Collection<NotificationTargetType> globalTargets,
            @Param("oneUserTarget") NotificationTargetType oneUserTarget,
            @Param("userId") Long userId,
            @Param("oneRoomTarget") NotificationTargetType oneRoomTarget,
            @Param("roomId") Long roomId
    );
}
