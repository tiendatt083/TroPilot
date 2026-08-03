package com.tropilot.repository;

import com.tropilot.entity.Room;
import com.tropilot.enums.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu phòng.
 * Cung cấp truy vấn lọc phòng và thống kê việc chưa nhập chỉ số điện nước theo tháng.
 */
public interface RoomRepository extends JpaRepository<Room, Long> {

    /** Tìm phòng theo mã phòng duy nhất. */
    Optional<Room> findByRoomCode(String roomCode);

    /** Kiểm tra mã phòng đã tồn tại trước khi tạo hoặc cập nhật. */
    boolean existsByRoomCode(String roomCode);

    /** Đếm phòng theo trạng thái, ví dụ AVAILABLE hoặc OCCUPIED. */
    long countByStatus(RoomStatus status);

    /** Lấy các phòng của một tòa nhà, sắp xếp theo mã phòng tăng dần. */
    List<Room> findAllByBuilding_IdOrderByRoomCodeAsc(Long buildingId);

    /** Đếm các phòng có trạng thái xác định nhưng chưa có chỉ số điện nước cho tháng được chọn. */
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

    /**
     * Lọc phòng theo tòa nhà, trạng thái và từ khóa mã/tên phòng. Tham số null nghĩa là không áp dụng điều kiện đó.
     */
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
