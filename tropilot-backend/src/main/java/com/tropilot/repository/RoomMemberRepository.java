package com.tropilot.repository;

import com.tropilot.entity.RoomMember;
import com.tropilot.enums.RoomMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    long countByRoom_IdAndStatus(Long roomId, RoomMemberStatus status);

    long countByStatus(RoomMemberStatus status);

    List<RoomMember> findByRoom_IdAndResidentHead_IdAndStatusIn(
            Long roomId,
            Long residentHeadId,
            Collection<RoomMemberStatus> statuses
    );

    boolean existsByRoom_IdAndStatusAndFullNameIgnoreCase(
            Long roomId,
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
            order by member.createdAt desc
            """)
    List<RoomMember> findByRoomIdWithDetails(@Param("roomId") Long roomId);

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
