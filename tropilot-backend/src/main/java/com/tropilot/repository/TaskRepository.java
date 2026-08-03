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

/**
 * Repository quản lý công việc giao cho nhân viên.
 * Các truy vấn chi tiết nạp sẵn tòa nhà, phòng, phản hồi nguồn, người được giao và người tạo task.
 */
public interface TaskRepository extends JpaRepository<Task, Long> {

    /** Đếm task theo trạng thái để phục vụ thống kê công việc. */
    long countByStatus(com.tropilot.enums.TaskStatus status);

    /** Đếm task của một nhân viên có trạng thái nằm trong danh sách truyền vào. */
    long countByAssignedTo_IdAndStatusIn(Long assignedToId, Collection<com.tropilot.enums.TaskStatus> statuses);

    /** Đếm task của nhân viên đã quá hạn nhưng vẫn thuộc các trạng thái chưa hoàn thành. */
    long countByAssignedTo_IdAndDeadlineBeforeAndStatusIn(
            Long assignedToId,
            LocalDateTime deadline,
            Collection<com.tropilot.enums.TaskStatus> statuses
    );

    /** Kiểm tra ảnh kết quả có thuộc task được giao cho một nhân viên cụ thể hay không. */
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

    /** Kiểm tra ảnh kết quả có thuộc task mà cư dân được phép xem qua phòng hoặc phản hồi của mình hay không. */
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

    /** Tìm task theo id và nạp đủ dữ liệu liên quan cho trang chi tiết. */
    @EntityGraph(attributePaths = {
            "building",
            "room",
            "room.building",
            "feedback",
            "assignedTo",
            "createdBy"
    })
    Optional<Task> findById(Long id);

    /** Lấy toàn bộ task với dữ liệu chi tiết, sắp xếp task tạo mới nhất trước. */
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

    /** Lấy các task liên quan trực tiếp đến tòa nhà hoặc đến phòng thuộc tòa nhà đó. */
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

    /** Lấy các task được giao cho một nhân viên cụ thể. */
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
