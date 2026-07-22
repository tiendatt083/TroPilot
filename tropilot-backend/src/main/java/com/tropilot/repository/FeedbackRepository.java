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
            "repliedBy",
            "tasks",
            "tasks.assignedTo"
    })
    Optional<Feedback> findById(Long id);

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
