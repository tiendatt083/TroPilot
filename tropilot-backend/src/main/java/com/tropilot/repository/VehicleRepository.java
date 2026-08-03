package com.tropilot.repository;

import com.tropilot.entity.Vehicle;
import com.tropilot.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý phương tiện của cư dân.
 * Các truy vấn chi tiết lấy kèm phòng và tòa nhà để dùng cho danh sách, lọc và tính phí gửi xe.
 */
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    /** Kiểm tra biển số đã tồn tại trong một trạng thái cụ thể hay chưa. */
    boolean existsByLicensePlateAndStatus(String licensePlate, VehicleStatus status);

    /** Kiểm tra biển số trùng khi cập nhật, bỏ qua phương tiện đang được chỉnh sửa. */
    boolean existsByLicensePlateAndStatusAndIdNot(String licensePlate, VehicleStatus status, Long id);

    /** Đếm phương tiện theo trạng thái. */
    long countByStatus(VehicleStatus status);

    /** Đếm phương tiện có trạng thái chỉ định trong một phòng. */
    long countByRoom_IdAndStatus(Long roomId, VehicleStatus status);

    /** Lấy phương tiện của phòng có trạng thái thuộc danh sách truyền vào. */
    List<Vehicle> findByRoom_IdAndStatusIn(Long roomId, List<VehicleStatus> statuses);

    /** Tìm phương tiện theo id và nạp sẵn phòng/tòa nhà. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where vehicle.id = :id
            """)
    Optional<Vehicle> findByIdWithDetails(@Param("id") Long id);

    /** Lấy tất cả phương tiện với thông tin phòng/tòa nhà, mới tạo trước. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findAllWithDetails();

    /** Lấy phương tiện có trạng thái nằm trong danh sách truyền vào. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where vehicle.status in :statuses
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByStatusInWithDetails(@Param("statuses") List<VehicleStatus> statuses);

    /** Lấy tất cả phương tiện của một tòa nhà. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where building.id = :buildingId
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy phương tiện của một tòa nhà theo nhiều trạng thái. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where building.id = :buildingId
              and vehicle.status in :statuses
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByBuildingIdAndStatusInWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("statuses") List<VehicleStatus> statuses
    );

    /** Lấy phương tiện theo một trạng thái cụ thể. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where vehicle.status = :status
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByStatusWithDetails(@Param("status") VehicleStatus status);

    /** Lấy phương tiện của một tòa nhà theo một trạng thái cụ thể. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where building.id = :buildingId
              and vehicle.status = :status
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByBuildingIdAndStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") VehicleStatus status
    );

    /** Lấy phương tiện của một phòng theo một trạng thái cụ thể. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where room.id = :roomId
              and vehicle.status = :status
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByRoomIdAndStatusWithDetails(
            @Param("roomId") Long roomId,
            @Param("status") VehicleStatus status
    );

    /** Lấy toàn bộ phương tiện của một phòng, không lọc trạng thái. */
    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where room.id = :roomId
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByRoomIdWithDetails(@Param("roomId") Long roomId);
}
