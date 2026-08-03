package com.tropilot.repository;

import com.tropilot.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý trạng thái đã đọc thông báo của từng người dùng.
 * Mỗi bản ghi nối một người dùng với một thông báo và thời điểm họ đã đọc.
 */
public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {

    /** Tìm trạng thái đọc của một người dùng đối với một thông báo cụ thể. */
    Optional<NotificationRead> findByNotification_IdAndUser_Id(Long notificationId, Long userId);

    /** Lấy các thông báo mà người dùng đã đọc trong một danh sách id thông báo. */
    List<NotificationRead> findByUser_IdAndNotification_IdIn(Long userId, Collection<Long> notificationIds);
}
