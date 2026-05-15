package com.tropilot.repository;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByRole(UserRole role);

    long countByRole(UserRole role);

    List<User> findAllByOrderByCreatedAtDesc();
}
