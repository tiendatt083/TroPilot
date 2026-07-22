package com.tropilot.repository;

import com.tropilot.entity.Room;
import com.tropilot.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByRoomCode(String roomCode);

    boolean existsByRoomCode(String roomCode);

    long countByStatus(RoomStatus status);

    List<Room> findAllByBuilding_IdOrderByRoomCodeAsc(Long buildingId);

    @Query("""
            select count(room)
            from Room room
            where room.status = :status
              and not exists (
                    select reading.id
                    from UtilityReading reading
                    where reading.room = room
                      and reading.month = :month
              )
            """)
    long countByStatusWithoutUtilityReadingForMonth(
            @Param("status") RoomStatus status,
            @Param("month") java.time.LocalDate month
    );

    @Query("""
            select room from Room room
            join fetch room.building building
            where (:buildingId is null or building.id = :buildingId)
              and (:status is null or room.status = :status)
              and (
                    :search is null
                    or lower(room.roomCode) like lower(concat('%', :search, '%'))
                    or lower(room.roomName) like lower(concat('%', :search, '%'))
                  )
            order by room.createdAt desc
            """)
    List<Room> findByFilters(
            @Param("buildingId") Long buildingId,
            @Param("status") RoomStatus status,
            @Param("search") String search
    );
}
