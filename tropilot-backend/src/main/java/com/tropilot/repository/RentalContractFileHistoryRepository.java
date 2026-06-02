package com.tropilot.repository;

import com.tropilot.entity.RentalContractFileHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalContractFileHistoryRepository extends JpaRepository<RentalContractFileHistory, Long> {

    @EntityGraph(attributePaths = {"replacedBy"})
    List<RentalContractFileHistory> findByRentalContract_IdOrderByReplacedAtDesc(Long rentalContractId);
}
