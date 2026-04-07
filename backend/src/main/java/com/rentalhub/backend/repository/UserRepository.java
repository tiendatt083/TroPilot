package com.rentalhub.backend.repository;

import com.rentalhub.backend.model.User;
import com.rentalhub.backend.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndRole(String email, UserRole role);
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
