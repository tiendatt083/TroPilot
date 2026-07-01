package com.tropilot.repository;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByRole(UserRole role);

    long countByRole(UserRole role);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findAllByMustChangePasswordTrue();

    List<User> findByRoleAndStatus(UserRole role, UserStatus status);
}
