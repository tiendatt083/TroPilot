package com.tropilot.repository;

import com.tropilot.entity.ServiceFee;
import com.tropilot.enums.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceFeeRepository extends JpaRepository<ServiceFee, Long> {

    boolean existsByBuilding_IdAndFeeCode(Long buildingId, String feeCode);

    boolean existsByBuilding_IdAndFeeTypeAndIsActiveTrue(Long buildingId, FeeType feeType);

    boolean existsByBuilding_IdAndFeeTypeAndIsActiveTrueAndIdNot(Long buildingId, FeeType feeType, Long id);

    List<ServiceFee> findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(Long buildingId);

    List<ServiceFee> findByBuilding_IdOrderByCreatedAtDesc(Long buildingId);
}
