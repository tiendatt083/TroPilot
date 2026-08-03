package com.tropilot.repository;

import com.tropilot.entity.Feedback;
import com.tropilot.enums.FeedbackType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

/**
 * Repository quản lý phản hồi, góp ý và khiếu nại của cư dân.
 * Các truy vấn chi tiết nạp sẵn phòng, tòa nhà, hóa đơn, người phản hồi và task xử lý.
 */
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    /** Đếm số phản hồi thuộc một hoặc nhiều trạng thái để phục vụ thống kê. */
    long countByStatusIn(Collection<com.tropilot.enums.FeedbackStatus> statuses);

    /** Lấy phản hồi mới nhất của một loại cụ thể gắn với hóa đơn. */
    Optional<Feedback> findFirstByInvoice_IdAndTypeOrderByCreatedAtDesc(Long invoiceId, FeedbackType type);

    /** Lấy mọi phản hồi liên quan đến một hóa đơn. */
    List<Feedback> findByInvoice_Id(Long invoiceId);

    /** Tìm phản hồi theo id và nạp đủ các quan hệ cần cho trang chi tiết. */
    @EntityGraph(attributePaths = {
            "residentHead",
            "room",
            "room.building",
            "invoice",
            "repliedBy",
            "tasks",
            "tasks.assignedTo"
    })
    Optional<Feedback> findById(Long id);

    /** Lấy toàn bộ phản hồi, kèm dữ liệu liên quan, theo thứ tự tạo mới nhất. */
    @Query("""
            select distinct feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            left join fetch feedback.tasks taskEntity
            left join fetch taskEntity.assignedTo assignedTo
            order by feedback.createdAt desc
            """)
    List<Feedback> findAllWithDetails();

    /** Lấy các phản hồi của một tòa nhà, kèm toàn bộ dữ liệu phục vụ hiển thị chi tiết. */
    @Query("""
            select distinct feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            left join fetch feedback.tasks taskEntity
            left join fetch taskEntity.assignedTo assignedTo
            where building.id = :buildingId
            order by feedback.createdAt desc
            """)
    List<Feedback> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy các phản hồi do một chủ hộ gửi cho một phòng cụ thể. */
    @Query("""
            select distinct feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            left join fetch feedback.tasks taskEntity
            left join fetch taskEntity.assignedTo assignedTo
            where residentHead.id = :residentHeadId
              and room.id = :roomId
            order by feedback.createdAt desc
            """)
    List<Feedback> findByResidentHeadIdAndRoomIdWithDetails(
            @Param("residentHeadId") Long residentHeadId,
            @Param("roomId") Long roomId
    );
}
