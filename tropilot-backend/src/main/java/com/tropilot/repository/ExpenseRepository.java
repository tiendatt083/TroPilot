package com.tropilot.repository;

import com.tropilot.entity.Expense;
import com.tropilot.enums.ExpenseStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "createdBy"
    })
    Optional<Expense> findById(Long id);

    @Query("""
            select expense from Expense expense
            left join fetch expense.room room
            left join fetch room.building building
            join fetch expense.createdBy createdBy
            order by expense.createdAt desc
            """)
    List<Expense> findAllWithDetails();

    @Query("""
            select expense from Expense expense
            left join fetch expense.room room
            left join fetch room.building building
            join fetch expense.createdBy createdBy
            where expense.status = :status
              and expense.createdAt >= :startDateTime
              and expense.createdAt < :endDateTime
            order by expense.createdAt desc
            """)
    List<Expense> findByStatusAndCreatedAtBetweenWithDetails(
            @Param("status") ExpenseStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    @Query("""
            select coalesce(sum(expense.amount), 0)
            from Expense expense
            where expense.status = :status
              and expense.createdAt >= :startDateTime
              and expense.createdAt < :endDateTime
            """)
    BigDecimal sumAmountByStatusAndCreatedAtBetween(
            @Param("status") ExpenseStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
