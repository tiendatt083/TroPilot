package com.tropilot.repository;

import com.tropilot.entity.RentalContract;
import com.tropilot.enums.RentalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {

    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId,
            RentalStatus rentalStatus
    );

    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId
    );
}
