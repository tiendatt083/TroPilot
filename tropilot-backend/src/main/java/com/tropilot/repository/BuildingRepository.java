package com.tropilot.repository;

import com.tropilot.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý dữ liệu tòa nhà.
 * Kế thừa JpaRepository để có sẵn các thao tác cơ bản như thêm, sửa, xóa và tìm theo id.
 */
public interface BuildingRepository extends JpaRepository<Building, Long> {

    /** Tìm một tòa nhà bằng mã tòa nhà duy nhất. */
    Optional<Building> findByBuildingCode(String buildingCode);

    /** Kiểm tra mã tòa nhà đã tồn tại hay chưa trước khi tạo hoặc cập nhật. */
    boolean existsByBuildingCode(String buildingCode);

    /** Lấy danh sách tòa nhà theo thứ tự tạo mới nhất. */
    List<Building> findAllByOrderByCreatedAtDesc();

    /** Tìm tòa nhà theo một từ khóa xuất hiện trong mã, tên hoặc địa chỉ. */
    @Query("""
            select building from Building building
            where lower(building.buildingCode) like lower(concat('%', :search, '%'))
               or lower(building.name) like lower(concat('%', :search, '%'))
               or lower(building.address) like lower(concat('%', :search, '%'))
            order by building.createdAt desc
            """)
    List<Building> searchByCodeNameOrAddress(@Param("search") String search);
}
