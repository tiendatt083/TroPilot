package com.tropilot.repository;

import com.tropilot.entity.SepayPayment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository quản lý giao dịch thanh toán QR qua SePay gắn với hóa đơn.
 */
public interface SepayPaymentRepository extends JpaRepository<SepayPayment, Long> {

    /** Tìm giao dịch SePay theo hóa đơn và nạp sẵn thông tin đầy đủ của hóa đơn liên quan. */
    @EntityGraph(attributePaths = {
            "invoice",
            "invoice.room",
            "invoice.room.building",
            "invoice.residentHead",
            "invoice.createdBy"
    })
    Optional<SepayPayment> findByInvoice_Id(Long invoiceId);

    /** Tìm giao dịch theo mã thanh toán do hệ thống tạo. */
    Optional<SepayPayment> findByPaymentCode(String paymentCode);

    /** Tìm giao dịch theo mã tham chiếu nhận được từ SePay/bank callback. */
    Optional<SepayPayment> findByReferenceCode(String referenceCode);

    /** Xóa giao dịch SePay gắn với một hóa đơn. */
    void deleteByInvoice_Id(Long invoiceId);
}
