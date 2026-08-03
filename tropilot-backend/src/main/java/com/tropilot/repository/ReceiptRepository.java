package com.tropilot.repository;

import com.tropilot.entity.Receipt;
import com.tropilot.enums.ReceiptStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý biên lai và các số liệu thu tiền.
 * Hỗ trợ truy vấn danh sách biên lai chi tiết và cộng tổng tiền theo trạng thái, thời gian hoặc tòa nhà.
 */
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    /** Kiểm tra một hóa đơn đã có biên lai ở trạng thái nhất định hay chưa. */
    boolean existsByInvoice_IdAndStatus(Long invoiceId, ReceiptStatus status);

    /** Cộng tổng tiền của các biên lai có cùng trạng thái trên toàn hệ thống. */
    @Query("""
            select coalesce(sum(receipt.amount), 0)
            from Receipt receipt
            where receipt.status = :status
            """)
    BigDecimal sumAmountByStatus(@Param("status") ReceiptStatus status);

    /** Tìm biên lai theo id và nạp sẵn hóa đơn, phòng, tòa nhà, chủ hộ và người lập. */
    @EntityGraph(attributePaths = {
            "invoice",
            "room",
            "room.building",
            "residentHead",
            "createdBy"
    })
    Optional<Receipt> findById(Long id);

    /** Lấy mọi biên lai với chi tiết liên quan, sắp xếp mới nhất trước. */
    @Query("""
            select receipt from Receipt receipt
            join fetch receipt.invoice invoice
            join fetch receipt.room room
            join fetch room.building building
            join fetch receipt.residentHead residentHead
            join fetch receipt.createdBy createdBy
            order by receipt.createdAt desc
            """)
    List<Receipt> findAllWithDetails();

    /** Lấy các biên lai của một tòa nhà với đầy đủ chi tiết. */
    @Query("""
            select receipt from Receipt receipt
            join fetch receipt.invoice invoice
            join fetch receipt.room room
            join fetch room.building building
            join fetch receipt.residentHead residentHead
            join fetch receipt.createdBy createdBy
            where building.id = :buildingId
            order by receipt.createdAt desc
            """)
    List<Receipt> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy biên lai theo trạng thái trong một khoảng thời gian; mốc kết thúc không được bao gồm. */
    @Query("""
            select receipt from Receipt receipt
            join fetch receipt.invoice invoice
            join fetch receipt.room room
            join fetch room.building building
            join fetch receipt.residentHead residentHead
            join fetch receipt.createdBy createdBy
            where receipt.status = :status
              and receipt.createdAt >= :startDateTime
              and receipt.createdAt < :endDateTime
            order by receipt.createdAt desc
            """)
    List<Receipt> findByStatusAndCreatedAtBetweenWithDetails(
            @Param("status") ReceiptStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    /** Lấy biên lai theo trạng thái và thời gian trong phạm vi một tòa nhà. */
    @Query("""
            select receipt from Receipt receipt
            join fetch receipt.invoice invoice
            join fetch receipt.room room
            join fetch room.building building
            join fetch receipt.residentHead residentHead
            join fetch receipt.createdBy createdBy
            where building.id = :buildingId
              and receipt.status = :status
              and receipt.createdAt >= :startDateTime
              and receipt.createdAt < :endDateTime
            order by receipt.createdAt desc
            """)
    List<Receipt> findByBuildingIdAndStatusAndCreatedAtBetweenWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") ReceiptStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    /** Cộng tiền biên lai theo trạng thái trong một khoảng thời gian trên toàn hệ thống. */
    @Query("""
            select coalesce(sum(receipt.amount), 0)
            from Receipt receipt
            where receipt.status = :status
              and receipt.createdAt >= :startDateTime
              and receipt.createdAt < :endDateTime
            """)
    BigDecimal sumAmountByStatusAndCreatedAtBetween(
            @Param("status") ReceiptStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    /** Cộng tiền biên lai theo trạng thái và thời gian trong một tòa nhà. */
    @Query("""
            select coalesce(sum(receipt.amount), 0)
            from Receipt receipt
            join receipt.room room
            join room.building building
            where building.id = :buildingId
              and receipt.status = :status
              and receipt.createdAt >= :startDateTime
              and receipt.createdAt < :endDateTime
            """)
    BigDecimal sumAmountByBuildingIdAndStatusAndCreatedAtBetween(
            @Param("buildingId") Long buildingId,
            @Param("status") ReceiptStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
