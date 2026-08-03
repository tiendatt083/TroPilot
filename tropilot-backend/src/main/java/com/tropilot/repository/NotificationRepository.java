package com.tropilot.repository;

import com.tropilot.entity.Notification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý thông báo hệ thống.
 * Khi lấy thông báo, repository nạp sẵn người tạo và danh sách người dùng/tòa nhà nhận thông báo.
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** Tìm một thông báo theo id và nạp đầy đủ đối tượng nhận để hiển thị chi tiết. */
    @EntityGraph(attributePaths = {
            "createdBy",
            "targetUsers",
            "targetUsers.user",
            "targetBuildings",
            "targetBuildings.building"
    })
    Optional<Notification> findById(Long id);

    /** Lấy tất cả thông báo theo thời điểm tạo giảm dần, kèm người tạo và đối tượng nhận. */
    @EntityGraph(attributePaths = {
            "createdBy",
            "targetUsers",
            "targetUsers.user",
            "targetBuildings",
            "targetBuildings.building"
    })
    List<Notification> findAllByOrderByCreatedAtDesc();
}
