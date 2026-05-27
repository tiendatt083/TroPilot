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

    @Query("""
            select notification from Notification notification
            join fetch notification.createdBy createdBy
            where (notification.targetType = :oneBuildingTarget
              and notification.targetId = :buildingId)
               or (notification.targetType = :oneRoomTarget
              and notification.targetId in (
                    select room.id
                    from Room room
                    where room.building.id = :buildingId
              ))
            order by notification.createdAt desc
            """)
    List<Notification> findByBuildingIdWithCreator(
            @Param("oneBuildingTarget") NotificationTargetType oneBuildingTarget,
            @Param("buildingId") Long buildingId,
            @Param("oneRoomTarget") NotificationTargetType oneRoomTarget
    );

    @Query("""
            select notification from Notification notification
            join fetch notification.createdBy createdBy
            where notification.targetType in :globalTargets
               or (notification.targetType = :oneUserTarget and notification.targetId = :userId)
               or (:roomId is not null and notification.targetType = :oneRoomTarget and notification.targetId = :roomId)
               or (:buildingId is not null and notification.targetType = :oneBuildingTarget and notification.targetId = :buildingId)
            order by notification.createdAt desc
            """)
    List<Notification> findVisibleNotifications(
            @Param("globalTargets") Collection<NotificationTargetType> globalTargets,
            @Param("oneUserTarget") NotificationTargetType oneUserTarget,
            @Param("userId") Long userId,
            @Param("oneRoomTarget") NotificationTargetType oneRoomTarget,
            @Param("roomId") Long roomId,
            @Param("oneBuildingTarget") NotificationTargetType oneBuildingTarget,
            @Param("buildingId") Long buildingId
    );
}
