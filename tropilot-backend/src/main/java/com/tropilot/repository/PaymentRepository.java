package com.tropilot.repository;

import com.tropilot.entity.Payment;
import com.tropilot.enums.PaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý phiếu thanh toán cư dân gửi để xác nhận hóa đơn.
 * Các truy vấn chi tiết nạp sẵn hóa đơn, phòng, tòa nhà, chủ hộ và người xác nhận.
 */
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /** Kiểm tra hóa đơn đã có phiếu thanh toán ở trạng thái xác định hay chưa. */
    boolean existsByInvoice_IdAndStatus(Long invoiceId, PaymentStatus status);

    /** Kiểm tra một hoặc nhiều ảnh minh chứng đã được sử dụng trong phiếu thanh toán nào chưa. */
    boolean existsByProofImageUrlIn(Collection<String> proofImageUrls);

    /** Kiểm tra ảnh minh chứng có thuộc phiếu thanh toán của một chủ hộ cụ thể hay không. */
    boolean existsByProofImageUrlInAndResidentHead_Id(Collection<String> proofImageUrls, Long residentHeadId);

    /** Xóa các phiếu thanh toán gắn với một hóa đơn, thường dùng khi hủy hoặc làm lại hóa đơn. */
    void deleteByInvoice_Id(Long invoiceId);

    /** Đếm phiếu thanh toán theo trạng thái để phục vụ thống kê hoặc hàng chờ xác nhận. */
    long countByStatus(PaymentStatus status);

    /** Tìm phiếu thanh toán theo id và nạp đủ thông tin liên quan. */
    @EntityGraph(attributePaths = {
            "invoice",
            "invoice.room",
            "invoice.room.building",
            "residentHead",
            "confirmedBy"
    })
    Optional<Payment> findById(Long id);

    /** Lấy phiếu thanh toán theo trạng thái, cũ nhất trước để xử lý theo thứ tự hàng chờ. */
    @Query("""
            select payment from Payment payment
            join fetch payment.invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch payment.residentHead residentHead
            left join fetch payment.confirmedBy confirmedBy
            where payment.status = :status
            order by payment.uploadedAt asc
            """)
    List<Payment> findByStatusWithDetails(@Param("status") PaymentStatus status);

    /** Lấy phiếu thanh toán theo trạng thái trong phạm vi một tòa nhà. */
    @Query("""
            select payment from Payment payment
            join fetch payment.invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch payment.residentHead residentHead
            left join fetch payment.confirmedBy confirmedBy
            where building.id = :buildingId
              and payment.status = :status
            order by payment.uploadedAt asc
            """)
    List<Payment> findByBuildingIdAndStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") PaymentStatus status
    );
}
