package com.tropilot.repository;

import com.tropilot.entity.RentalContract;
import com.tropilot.enums.RentalStatus;
import org.springframework.data.jpa.repository.EntityGraph;
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
            order by contract.createdAt desc
            """)
    List<RentalContract> findAllWithDetails();

    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where building.id = :buildingId
            order by contract.createdAt desc
            """)
    List<RentalContract> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

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

    @EntityGraph(attributePaths = {"room", "room.building", "residentHead"})
    Optional<RentalContract> findFirstByResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
            Long residentHeadId,
            RentalStatus rentalStatus
    );
}
