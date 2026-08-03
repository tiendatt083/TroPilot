package com.tropilot.repository;

import com.tropilot.entity.ActivityLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Repository làm việc với bảng nhật ký hoạt động của hệ thống.
 * Các truy vấn luôn lấy kèm người thực hiện để phục vụ màn hình lịch sử thao tác.
 */
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Lấy toàn bộ nhật ký mới nhất trước, kèm thông tin người thực hiện. */
    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    /**
     * Tìm nhật ký theo từ khóa trong hành động, mô tả, họ tên hoặc email của người thực hiện.
     */
    @EntityGraph(attributePaths = "user")
    @Query("""
            select log
            from ActivityLog log
            join fetch log.user user
            where lower(log.action) like lower(concat('%', :query, '%'))
               or lower(log.description) like lower(concat('%', :query, '%'))
               or lower(user.fullName) like lower(concat('%', :query, '%'))
               or lower(user.email) like lower(concat('%', :query, '%'))
            order by log.createdAt desc
            """)
    List<ActivityLog> searchByQuery(@Param("query") String query);

    /** Lấy các nhật ký thuộc riêng một người dùng, sắp xếp mới nhất trước. */
    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findByUser_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Tìm nhật ký của một người dùng cụ thể theo từ khóa, dùng khi lọc lịch sử thao tác cá nhân.
     */
    @EntityGraph(attributePaths = "user")
    @Query("""
            select log
            from ActivityLog log
            join fetch log.user user
            where user.id = :userId
              and (
                    lower(log.action) like lower(concat('%', :query, '%'))
                 or lower(log.description) like lower(concat('%', :query, '%'))
                 or lower(user.fullName) like lower(concat('%', :query, '%'))
                 or lower(user.email) like lower(concat('%', :query, '%'))
              )
            order by log.createdAt desc
            """)
    List<ActivityLog> searchByUserIdAndQuery(@Param("userId") Long userId, @Param("query") String query);
}
