package com.tropilot.repository;

import com.tropilot.entity.RentalContract;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {

    long countByRentalStatusAndEndDateBetween(RentalStatus rentalStatus, LocalDate startDate, LocalDate endDate);

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            order by contract.createdAt desc
            """)
    List<RentalContract> findByRentalStatusAndAssignmentStatusWithDetails(
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where building.id = :buildingId
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            order by contract.createdAt desc
            """)
    List<RentalContract> findByBuildingIdAndRentalStatusAndAssignmentStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.id = :id
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            """)
    Optional<RentalContract> findByIdAndRentalStatusAndAssignmentStatusWithDetails(
            @Param("id") Long id,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.id = :id
            """)
    Optional<RentalContract> findByIdWithDetails(@Param("id") Long id);

    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId,
            RentalStatus rentalStatus
    );

    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId
    );

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where residentHead.id = :residentHeadId
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
            )
            order by contract.createdAt desc
            """)
    List<RentalContract> findCurrentByResidentHeadIdWithDetails(
            @Param("residentHeadId") Long residentHeadId,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );
}
