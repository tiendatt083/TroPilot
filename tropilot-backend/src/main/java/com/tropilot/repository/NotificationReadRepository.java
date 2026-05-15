package com.tropilot.repository;

import com.tropilot.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {

    Optional<NotificationRead> findByNotification_IdAndUser_Id(Long notificationId, Long userId);

    List<NotificationRead> findByUser_IdAndNotification_IdIn(Long userId, Collection<Long> notificationIds);
}
