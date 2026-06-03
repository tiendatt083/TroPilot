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

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    long countByStatusIn(Collection<com.tropilot.enums.FeedbackStatus> statuses);

    Optional<Feedback> findFirstByInvoice_IdAndTypeOrderByCreatedAtDesc(Long invoiceId, FeedbackType type);

    List<Feedback> findByInvoice_Id(Long invoiceId);

    @EntityGraph(attributePaths = {
            "residentHead",
            "room",
            "room.building",
            "invoice",
            "repliedBy"
    })
    Optional<Feedback> findById(Long id);

    @Query("""
            select feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            order by feedback.createdAt desc
            """)
    List<Feedback> findAllWithDetails();

    @Query("""
            select feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            where building.id = :buildingId
            order by feedback.createdAt desc
            """)
    List<Feedback> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    @Query("""
            select feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            where feedback.type = :type
            order by feedback.createdAt desc
            """)
    List<Feedback> findByTypeWithDetails(@Param("type") FeedbackType type);

    @Query("""
            select feedback from Feedback feedback
            join fetch feedback.residentHead residentHead
            join fetch feedback.room room
            join fetch room.building building
            left join fetch feedback.invoice invoice
            left join fetch feedback.repliedBy repliedBy
            where building.id = :buildingId
              and feedback.type = :type
            order by feedback.createdAt desc
            """)
    List<Feedback> findByBuildingIdAndTypeWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("type") FeedbackType type
    );
}
