package com.tropilot.repository;

import com.tropilot.entity.RoomAssignment;
import com.tropilot.enums.RoomAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, Long> {

    boolean existsByRoom_IdAndStatus(Long roomId, RoomAssignmentStatus status);

    boolean existsByResidentHead_IdAndStatus(Long residentHeadId, RoomAssignmentStatus status);

    long countByStatus(RoomAssignmentStatus status);

    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where room.id = :roomId
              and assignment.status = :status
            """)
    Optional<RoomAssignment> findByRoomIdAndStatus(
            @Param("roomId") Long roomId,
            @Param("status") RoomAssignmentStatus status
    );

    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where residentHead.id = :residentHeadId
              and assignment.status = :status
            """)
    Optional<RoomAssignment> findByResidentHeadIdAndStatus(
            @Param("residentHeadId") Long residentHeadId,
            @Param("status") RoomAssignmentStatus status
    );

    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where residentHead.id in :residentHeadIds
              and assignment.status = :status
            """)
    List<RoomAssignment> findAllByResidentHeadIdInAndStatus(
            @Param("residentHeadIds") List<Long> residentHeadIds,
            @Param("status") RoomAssignmentStatus status
    );
}
