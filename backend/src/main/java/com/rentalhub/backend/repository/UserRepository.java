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

    @Query("SELECT u FROM User u WHERE u.emailOrPhone = :emailOrPhone AND u.role = :role")
    Optional<User> findByEmailOrPhoneAndRole(@Param("emailOrPhone") String emailOrPhone, @Param("role") UserRole role);

    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.emailOrPhone = :emailOrPhone AND u.role = :role")
    boolean existsByEmailOrPhoneAndRole(@Param("emailOrPhone") String emailOrPhone, @Param("role") UserRole role);
}
