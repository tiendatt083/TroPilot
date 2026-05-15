package com.tropilot.repository;

import com.tropilot.entity.Payment;
import com.tropilot.enums.PaymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    boolean existsByInvoice_IdAndStatus(Long invoiceId, PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @EntityGraph(attributePaths = {
            "invoice",
            "invoice.room",
            "invoice.room.building",
            "residentHead",
            "confirmedBy"
    })
    Optional<Payment> findById(Long id);

    @Query("""
            select payment from Payment payment
            join fetch payment.invoice invoice
            join fetch invoice.room room
            join fetch room.building building
            join fetch payment.residentHead residentHead
            left join fetch payment.confirmedBy confirmedBy
            where residentHead.id = :residentHeadId
            order by payment.uploadedAt desc
            """)
    List<Payment> findByResidentHeadIdWithDetails(@Param("residentHeadId") Long residentHeadId);

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
}
