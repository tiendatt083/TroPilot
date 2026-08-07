package com.tropilot.repository;

import com.tropilot.entity.Invoice;
import com.tropilot.enums.InvoiceStatus;
import com.tropilot.enums.InvoiceType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý hóa đơn và các truy vấn thống kê công nợ.
 * Những truy vấn "WithDetails" nạp sẵn phòng, tòa nhà, chủ hộ, người lập và các dòng phí của hóa đơn.
 */
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    /** Kiểm tra một phòng đã có hóa đơn cho tháng được chọn hay chưa. */
    boolean existsByRoom_IdAndMonthAndInvoiceType(Long roomId, LocalDate month, InvoiceType invoiceType);

    /** Kiểm tra phòng đã từng có hóa đơn gắn với chủ hộ này hay chưa. */
    boolean existsByRoom_IdAndResidentHead_Id(Long roomId, Long residentHeadId);

    /** Kiểm tra trùng hóa đơn theo đúng chủ hộ, kỳ và loại hóa đơn. */
    boolean existsByRoom_IdAndResidentHead_IdAndMonthAndInvoiceType(
            Long roomId,
            Long residentHeadId,
            LocalDate month,
            InvoiceType invoiceType
    );

    /** Đếm hóa đơn theo trạng thái để dùng trong thống kê. */
    long countByStatus(InvoiceStatus status);

    /** Đếm hóa đơn quá hạn nhưng chưa ở trạng thái được loại trừ (thường là PAID). */
    long countByDueDateBeforeAndStatusNot(LocalDate dueDate, InvoiceStatus status);

    /** Tìm hóa đơn theo id và nạp đủ dữ liệu cần cho trang chi tiết. */
    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "residentHead",
            "createdBy",
            "items",
            "items.serviceFee"
    })
    Optional<Invoice> findById(Long id);

    /** Lấy hóa đơn gần nhất của một phòng, ưu tiên tháng mới rồi đến thời điểm tạo mới. */
    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "residentHead",
            "createdBy",
            "items",
            "items.serviceFee"
    })
    Optional<Invoice> findFirstByRoom_IdOrderByMonthDescCreatedAtDesc(Long roomId);

    /** Lấy toàn bộ hóa đơn với dữ liệu chi tiết, sắp xếp từ tháng mới nhất. */
    @Query("""
            select distinct invoice from Invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch invoice.residentHead residentHead
            join fetch invoice.createdBy createdBy
            left join fetch invoice.items items
            left join fetch items.serviceFee serviceFee
            order by invoice.month desc, invoice.createdAt desc
            """)
    List<Invoice> findAllWithDetails();

    /** Lấy các hóa đơn của một phòng với đầy đủ chi tiết. */
    @Query("""
            select distinct invoice from Invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch invoice.residentHead residentHead
            join fetch invoice.createdBy createdBy
            left join fetch invoice.items items
            left join fetch items.serviceFee serviceFee
            where room.id = :roomId
            order by invoice.month desc, invoice.createdAt desc
            """)
    List<Invoice> findByRoomIdWithDetails(@Param("roomId") Long roomId);

    /**
     * Lấy hóa đơn thuộc chính chủ hộ, kể cả khi người này đã kết thúc phân phòng.
     * Không truy vấn theo roomId để chủ hộ mới không thấy hóa đơn của chủ hộ cũ.
     */
    @Query("""
            select distinct invoice from Invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch invoice.residentHead residentHead
            join fetch invoice.createdBy createdBy
            left join fetch invoice.items items
            left join fetch items.serviceFee serviceFee
            where residentHead.id = :residentHeadId
            order by invoice.month desc, invoice.createdAt desc
            """)
    List<Invoice> findByResidentHeadIdWithDetails(@Param("residentHeadId") Long residentHeadId);

    /** Lấy các hóa đơn thuộc một tòa nhà với đầy đủ chi tiết. */
    @Query("""
            select distinct invoice from Invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch invoice.residentHead residentHead
            join fetch invoice.createdBy createdBy
            left join fetch invoice.items items
            left join fetch items.serviceFee serviceFee
            where building.id = :buildingId
            order by invoice.month desc, invoice.createdAt desc
            """)
    List<Invoice> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Tính tổng tiền chưa thanh toán của toàn hệ thống trong một tháng. */
    @Query("""
            select coalesce(sum(invoice.totalAmount), 0)
            from Invoice invoice
            where invoice.month = :month
              and invoice.status <> :paidStatus
            """)
    BigDecimal sumUnpaidAmountByMonth(
            @Param("month") LocalDate month,
            @Param("paidStatus") InvoiceStatus paidStatus
    );

    /** Tính tổng tiền chưa thanh toán của một tòa nhà trong một tháng. */
    @Query("""
            select coalesce(sum(invoice.totalAmount), 0)
            from Invoice invoice
            join invoice.room room
            join room.building building
            where building.id = :buildingId
              and invoice.month = :month
              and invoice.status <> :paidStatus
            """)
    BigDecimal sumUnpaidAmountByBuildingIdAndMonth(
            @Param("buildingId") Long buildingId,
            @Param("month") LocalDate month,
            @Param("paidStatus") InvoiceStatus paidStatus
    );

    /** Tính tổng công nợ chưa thanh toán của toàn bộ hệ thống, không giới hạn tháng. */
    @Query("""
            select coalesce(sum(invoice.totalAmount), 0)
            from Invoice invoice
            where invoice.status <> :paidStatus
            """)
    BigDecimal sumUnpaidAmount(@Param("paidStatus") InvoiceStatus paidStatus);
}
