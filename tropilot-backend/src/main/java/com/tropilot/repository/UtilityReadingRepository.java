package com.tropilot.repository;

import com.tropilot.entity.UtilityReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UtilityReadingRepository extends JpaRepository<UtilityReading, Long> {

    boolean existsByRoom_IdAndMonth(Long roomId, LocalDate month);

    boolean existsByRoom_IdAndMonthAndIdNot(Long roomId, LocalDate month, Long id);

    @Query("""
            select case when count(reading) > 0 then true else false end
            from UtilityReading reading
            where reading.electricityImageUrl in :urls
               or reading.waterImageUrl in :urls
            """)
    boolean existsByAnyImageUrlIn(@Param("urls") Collection<String> urls);

    @Query("""
            select case when count(reading) > 0 then true else false end
            from UtilityReading reading
            where (reading.electricityImageUrl in :urls or reading.waterImageUrl in :urls)
              and reading.room.id = :roomId
            """)
    boolean existsByAnyImageUrlInAndRoomId(
            @Param("urls") Collection<String> urls,
            @Param("roomId") Long roomId
    );

    Optional<UtilityReading> findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(Long roomId, LocalDate month);

    @Query("""
            select distinct reading.room.id
            from UtilityReading reading
            where reading.room.building.id = :buildingId
              and reading.month = :month
            """)
    List<Long> findRoomIdsByBuildingIdAndMonth(
            @Param("buildingId") Long buildingId,
            @Param("month") LocalDate month
    );

    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where room.id = :roomId
              and reading.month = :month
            """)
    Optional<UtilityReading> findByRoomIdAndMonthWithDetails(
            @Param("roomId") Long roomId,
            @Param("month") LocalDate month
    );

    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where reading.id = :id
            """)
    Optional<UtilityReading> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findAllWithDetails();

    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where building.id = :buildingId
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where room.id = :roomId
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findByRoomIdWithDetails(@Param("roomId") Long roomId);
}
