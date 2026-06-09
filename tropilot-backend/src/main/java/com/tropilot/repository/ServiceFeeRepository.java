package com.tropilot.repository;

import com.tropilot.entity.ServiceFee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceFeeRepository extends JpaRepository<ServiceFee, Long> {

    boolean existsByBuilding_IdAndFeeCode(Long buildingId, String feeCode);

    Optional<ServiceFee> findByBuilding_IdAndFeeCode(Long buildingId, String feeCode);

    List<ServiceFee> findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(Long buildingId);

    List<ServiceFee> findByBuilding_IdOrderByCreatedAtDesc(Long buildingId);
}
