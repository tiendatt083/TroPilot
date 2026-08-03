package com.tropilot.repository;

import com.tropilot.entity.RoomAssignment;
import com.tropilot.enums.RoomAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý việc phân phòng cho chủ hộ.
 * Phân phòng là liên kết giữa phòng và cư dân đại diện, có trạng thái như ACTIVE để xác định người đang ở.
 */
public interface RoomAssignmentRepository extends JpaRepository<RoomAssignment, Long> {

    /** Kiểm tra một phòng có phân phòng ở trạng thái chỉ định hay không. */
    boolean existsByRoom_IdAndStatus(Long roomId, RoomAssignmentStatus status);

    /** Kiểm tra một chủ hộ có đang có phân phòng ở trạng thái chỉ định hay không. */
    boolean existsByResidentHead_IdAndStatus(Long residentHeadId, RoomAssignmentStatus status);

    /** Đếm số phân phòng theo trạng thái để dùng trong thống kê. */
    long countByStatus(RoomAssignmentStatus status);

    /** Tìm phân phòng của một phòng theo trạng thái và nạp thông tin phòng/tòa nhà/chủ hộ. */
    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where room.id = :roomId
              and assignment.status = :status
            """)
    Optional<RoomAssignment> findByRoomIdAndStatus(
            @Param("roomId") Long roomId,
            @Param("status") RoomAssignmentStatus status
    );

    /** Tìm phân phòng của một chủ hộ theo trạng thái và nạp thông tin liên quan. */
    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where residentHead.id = :residentHeadId
              and assignment.status = :status
            """)
    Optional<RoomAssignment> findByResidentHeadIdAndStatus(
            @Param("residentHeadId") Long residentHeadId,
            @Param("status") RoomAssignmentStatus status
    );

    /** Lấy các phân phòng của nhiều chủ hộ cùng lúc theo trạng thái, tránh phải truy vấn từng người. */
    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where residentHead.id in :residentHeadIds
              and assignment.status = :status
            """)
    List<RoomAssignment> findAllByResidentHeadIdInAndStatus(
            @Param("residentHeadIds") List<Long> residentHeadIds,
            @Param("status") RoomAssignmentStatus status
    );

    /** Lấy các phân phòng của một tòa nhà theo trạng thái, sắp xếp mã phòng tăng dần. */
    @Query("""
            select assignment from RoomAssignment assignment
            join fetch assignment.room room
            join fetch room.building building
            join fetch assignment.residentHead residentHead
            where building.id = :buildingId
              and assignment.status = :status
            order by room.roomCode asc
            """)
    List<RoomAssignment> findByBuildingIdAndStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") RoomAssignmentStatus status
    );
}
