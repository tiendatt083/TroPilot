package com.tropilot.repository;

import com.tropilot.entity.MaintenanceRequest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý yêu cầu sửa chữa/bảo trì.
 * Hỗ trợ lọc theo tòa nhà, cư dân, nhân viên được giao và kiểm tra ảnh tệp đã được sử dụng.
 */
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {

    /** Đếm số yêu cầu theo trạng thái để làm thống kê. */
    long countByStatus(com.tropilot.enums.MaintenanceStatus status);

    /** Đếm các yêu cầu thuộc những trạng thái chỉ định mà một nhân viên đang được giao xử lý. */
    long countByAssignedTo_IdAndStatusIn(Long assignedToId, Collection<com.tropilot.enums.MaintenanceStatus> statuses);

    /** Kiểm tra thiết bị có đang được tham chiếu bởi yêu cầu bảo trì nào không. */
    boolean existsByEquipment_Id(Long equipmentId);

    /** Kiểm tra thiết bị có yêu cầu bảo trì ở một trong các trạng thái đang quan tâm hay không. */
    boolean existsByEquipment_IdAndStatusIn(
            Long equipmentId,
            Collection<com.tropilot.enums.MaintenanceStatus> statuses
    );

    /** Kiểm tra một trong các URL ảnh đã được dùng làm ảnh yêu cầu hoặc ảnh kết quả ở bất kỳ yêu cầu nào. */
    @Query("""
            select case when count(request) > 0 then true else false end
            from MaintenanceRequest request
            where request.imageUrl in :urls
               or request.resultImageUrl in :urls
            """)
    boolean existsByAnyImageUrlIn(@Param("urls") Collection<String> urls);

    /** Kiểm tra các URL ảnh có thuộc yêu cầu do một nhân viên cụ thể được giao hay không. */
    @Query("""
            select case when count(request) > 0 then true else false end
            from MaintenanceRequest request
            where (request.imageUrl in :urls or request.resultImageUrl in :urls)
              and request.assignedTo.id = :staffId
            """)
    boolean existsByAnyImageUrlInAndAssignedToId(
            @Param("urls") Collection<String> urls,
            @Param("staffId") Long staffId
    );

    /** Kiểm tra các URL ảnh có thuộc yêu cầu của một chủ hộ/người gửi cụ thể hay không. */
    @Query("""
            select case when count(request) > 0 then true else false end
            from MaintenanceRequest request
            where (request.imageUrl in :urls or request.resultImageUrl in :urls)
              and (request.residentHead.id = :residentHeadId or request.requestedBy.id = :residentHeadId)
            """)
    boolean existsByAnyImageUrlInAndResidentHeadId(
            @Param("urls") Collection<String> urls,
            @Param("residentHeadId") Long residentHeadId
    );

    /** Tìm một yêu cầu theo id và nạp đủ các quan hệ cần cho trang chi tiết. */
    @EntityGraph(attributePaths = {
            "room",
            "room.building",
            "building",
            "residentHead",
            "requestedBy",
            "assignedTo",
            "equipment"
    })
    Optional<MaintenanceRequest> findById(Long id);

    /** Lấy toàn bộ yêu cầu bảo trì, mới nhất trước, kèm phòng/tòa nhà/người dùng/thiết bị liên quan. */
    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findAllWithDetails();

    /** Lấy yêu cầu gắn trực tiếp với tòa nhà hoặc gắn với phòng thuộc tòa nhà đó. */
    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where directBuilding.id = :buildingId
               or roomBuilding.id = :buildingId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy yêu cầu của một chủ hộ cho phòng đang ở, bao gồm cả yêu cầu trực tiếp đối với thiết bị. */
    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            left join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where (room.id = :roomId and residentHead.id = :residentHeadId)
               or (requestedBy.id = :residentHeadId and equipment.id is not null)
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByRoomIdAndResidentHeadIdWithDetails(
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    /** Lấy danh sách yêu cầu được giao cho một nhân viên, kèm đầy đủ dữ liệu hiển thị. */
    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where assignedTo.id = :staffId
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByAssignedToIdWithDetails(@Param("staffId") Long staffId);

    /** Lấy yêu cầu của một nhân viên nhưng chỉ trong phạm vi một tòa nhà. */
    @Query("""
            select distinct request from MaintenanceRequest request
            left join fetch request.room room
            left join fetch room.building roomBuilding
            left join fetch request.building directBuilding
            left join fetch request.residentHead residentHead
            left join fetch request.requestedBy requestedBy
            join fetch request.assignedTo assignedTo
            left join fetch request.equipment equipment
            where assignedTo.id = :staffId
              and (directBuilding.id = :buildingId or roomBuilding.id = :buildingId)
            order by request.createdAt desc
            """)
    List<MaintenanceRequest> findByAssignedToIdAndBuildingIdWithDetails(
            @Param("staffId") Long staffId,
            @Param("buildingId") Long buildingId
    );
}
