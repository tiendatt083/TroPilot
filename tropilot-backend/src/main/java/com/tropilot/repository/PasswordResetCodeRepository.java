package com.tropilot.repository;

import com.tropilot.entity.PasswordResetCode;
import com.tropilot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCode, Long> {

    Optional<PasswordResetCode> findFirstByUserAndUsedAtIsNullOrderByCreatedAtDesc(User user);

    @Modifying
    @Query("update PasswordResetCode code set code.usedAt = :usedAt where code.user = :user and code.usedAt is null")
    int markUnusedCodesAsUsed(@Param("user") User user, @Param("usedAt") LocalDateTime usedAt);
}
