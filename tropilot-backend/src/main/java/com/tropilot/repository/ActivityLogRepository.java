package com.tropilot.repository;

import com.tropilot.entity.ActivityLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "user")
    @Query("""
            select log
            from ActivityLog log
            join fetch log.user user
            where lower(log.action) like lower(concat('%', :query, '%'))
               or lower(log.description) like lower(concat('%', :query, '%'))
               or lower(user.fullName) like lower(concat('%', :query, '%'))
               or lower(user.email) like lower(concat('%', :query, '%'))
            order by log.createdAt desc
            """)
    List<ActivityLog> searchByQuery(@Param("query") String query);

    @EntityGraph(attributePaths = "user")
    List<ActivityLog> findByUser_IdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    @Query("""
            select log
            from ActivityLog log
            join fetch log.user user
            where user.id = :userId
              and (
                    lower(log.action) like lower(concat('%', :query, '%'))
                 or lower(log.description) like lower(concat('%', :query, '%'))
                 or lower(user.fullName) like lower(concat('%', :query, '%'))
                 or lower(user.email) like lower(concat('%', :query, '%'))
              )
            order by log.createdAt desc
            """)
    List<ActivityLog> searchByUserIdAndQuery(@Param("userId") Long userId, @Param("query") String query);
}
