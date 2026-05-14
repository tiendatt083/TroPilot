package com.tropilot.repository;

import com.tropilot.entity.ServiceFee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceFeeRepository extends JpaRepository<ServiceFee, Long> {

    boolean existsByFeeCode(String feeCode);

    Optional<ServiceFee> findByFeeCode(String feeCode);

    List<ServiceFee> findAllByOrderByCreatedAtDesc();
}
