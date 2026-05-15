package com.tropilot.repository;

import com.tropilot.entity.Invoice;
import com.tropilot.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    boolean existsByRoom_IdAndMonth(Long roomId, LocalDate month);

    long countByStatus(InvoiceStatus status);

    long countByDueDateBeforeAndStatusNot(LocalDate dueDate, InvoiceStatus status);

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "residentHead",
            "createdBy",
            "items",
            "items.serviceFee"
    })
    Optional<Invoice> findById(Long id);

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "residentHead",
            "createdBy",
            "items",
            "items.serviceFee"
    })
    Optional<Invoice> findFirstByRoom_IdOrderByMonthDescCreatedAtDesc(Long roomId);

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

    @Query("""
            select coalesce(sum(invoice.totalAmount), 0)
            from Invoice invoice
            where invoice.status <> :paidStatus
            """)
    BigDecimal sumUnpaidAmount(@Param("paidStatus") InvoiceStatus paidStatus);
}
