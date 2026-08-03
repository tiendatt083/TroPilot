package com.tropilot.repository;

import com.tropilot.entity.Equipment;
import com.tropilot.enums.EquipmentCondition;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý thiết bị tại các tòa nhà và phòng.
 * Các truy vấn chi tiết nạp sẵn tòa nhà/phòng để tránh phải truy vấn lặp lại khi hiển thị danh sách.
 */
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    /** Kiểm tra mã thiết bị có bị trùng trong cùng một tòa nhà hay không. */
    boolean existsByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    /** Đếm thiết bị có tiền tố mã nhất định để hỗ trợ sinh mã thiết bị mới. */
    long countByBuilding_IdAndEquipmentCodeStartingWith(Long buildingId, String equipmentCodePrefix);

    /** Tìm thiết bị theo cặp tòa nhà và mã thiết bị. */
    Optional<Equipment> findByBuilding_IdAndEquipmentCode(Long buildingId, String equipmentCode);

    /** Lấy tất cả thiết bị kèm tòa nhà/phòng, sắp xếp theo tòa nhà, phạm vi sử dụng rồi đến tên. */
    @Query("""
            select equipment
            from Equipment equipment
            join fetch equipment.building building
            left join fetch equipment.room room
            order by building.buildingCode asc, equipment.scope asc, equipment.name asc
            """)
    List<Equipment> findAllWithBuildingAndRoom();

    /** Lấy toàn bộ thiết bị của một tòa nhà, kèm thông tin phòng nếu thiết bị thuộc phòng. */
    @EntityGraph(attributePaths = {"building", "room"})
    List<Equipment> findByBuilding_IdOrderByScopeAscNameAsc(Long buildingId);

    /** Lấy các thiết bị của tòa nhà không có tình trạng được truyền vào, ví dụ lọc bỏ thiết bị tốt. */
    @EntityGraph(attributePaths = {"building", "room"})
    List<Equipment> findByBuilding_IdAndConditionNotOrderByScopeAscNameAsc(
            Long buildingId,
            EquipmentCondition condition
    );

    /** Tìm thiết bị theo id và nạp sẵn tòa nhà/phòng liên quan. */
    @Override
    @EntityGraph(attributePaths = {"building", "room"})
    Optional<Equipment> findById(Long id);
}
