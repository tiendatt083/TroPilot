package com.tropilot.repository;

import com.tropilot.entity.RoomMember;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    List<RoomMember> findByRoom_IdAndStatusIn(Long roomId, Collection<RoomMemberStatus> statuses);

    long countByRoom_IdAndResidentHead_IdAndStatus(Long roomId, Long residentHeadId, RoomMemberStatus status);

    @Query("""
            select count(member) from RoomMember member
            where member.status = :memberStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = member.room
                    and assignment.residentHead = member.residentHead
                    and assignment.status = :assignmentStatus
              )
            """)
    long countByStatusWithActiveAssignment(
            @Param("memberStatus") RoomMemberStatus memberStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    boolean existsByRoom_IdAndResidentHead_IdAndStatusAndFullNameIgnoreCase(
            Long roomId,
            Long residentHeadId,
            RoomMemberStatus status,
            String fullName
    );

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where member.id = :id
            """)
    Optional<RoomMember> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where room.id = :roomId
              and member.status in :statuses
            order by member.createdAt desc
            """)
    List<RoomMember> findByRoomIdAndStatusInWithDetails(
            @Param("roomId") Long roomId,
            @Param("statuses") Collection<RoomMemberStatus> statuses
    );

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where room.id = :roomId
              and residentHead.id = :residentHeadId
            order by member.createdAt desc
            """)
    List<RoomMember> findByRoomIdAndResidentHeadIdWithDetails(
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where building.id = :buildingId
            order by member.createdAt desc
            """)
    List<RoomMember> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where member.status = :status
            order by member.createdAt desc
            """)
    List<RoomMember> findByStatusWithDetails(@Param("status") RoomMemberStatus status);

    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where building.id = :buildingId
              and member.status = :status
            order by member.createdAt desc
            """)
    List<RoomMember> findByBuildingIdAndStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") RoomMemberStatus status
    );
}
