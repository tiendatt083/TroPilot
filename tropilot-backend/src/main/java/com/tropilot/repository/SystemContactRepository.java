package com.tropilot.repository;

import com.tropilot.entity.SystemContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SystemContactRepository extends JpaRepository<SystemContact, Long> {

    Optional<SystemContact> findFirstByOrderByIdAsc();
}
