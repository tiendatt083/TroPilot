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

public interface ReceiptRepository extends JpaRepository<Receipt, Long> {

    boolean existsByInvoice_IdAndStatus(Long invoiceId, ReceiptStatus status);

    @Query("""
            select coalesce(sum(receipt.amount), 0)
            from Receipt receipt
            where receipt.status = :status
            """)
    BigDecimal sumAmountByStatus(@Param("status") ReceiptStatus status);

    @EntityGraph(attributePaths = {
            "invoice",
            "room",
            "room.building",
            "residentHead",
            "createdBy"
    })
    Optional<Receipt> findById(Long id);

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
}
