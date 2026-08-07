package com.tropilot.repository;

import com.tropilot.entity.UtilityReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý chỉ số điện và nước theo phòng, theo tháng.
 * Hỗ trợ kiểm tra ảnh chụp đồng hồ, tìm kỳ trước và lập danh sách các phòng chưa/đã nhập chỉ số.
 */
public interface UtilityReadingRepository extends JpaRepository<UtilityReading, Long> {

    /** Kiểm tra một phòng đã có chỉ số cho tháng được chọn hay chưa. */
    boolean existsByRoom_IdAndMonth(Long roomId, LocalDate month);

    /** Kiểm tra trùng chỉ số phòng/tháng khi cập nhật, loại trừ bản ghi hiện tại. */
    boolean existsByRoom_IdAndMonthAndIdNot(Long roomId, LocalDate month, Long id);

    /** Kiểm tra các URL ảnh đã được dùng làm ảnh điện hoặc nước ở bản ghi nào chưa. */
    @Query("""
            select case when count(reading) > 0 then true else false end
            from UtilityReading reading
            where reading.electricityImageUrl in :urls
               or reading.waterImageUrl in :urls
            """)
    boolean existsByAnyImageUrlIn(@Param("urls") Collection<String> urls);

    /** Kiểm tra các URL ảnh có thuộc bản ghi chỉ số của một phòng cụ thể hay không. */
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

    /** Lấy chỉ số gần nhất trước một tháng của phòng để dùng làm kỳ trước. */
    Optional<UtilityReading> findFirstByRoom_IdAndMonthBeforeOrderByMonthDescCreatedAtDesc(Long roomId, LocalDate month);

    /** Lấy id những phòng của tòa nhà đã có chỉ số trong tháng, phục vụ đối chiếu danh sách còn thiếu. */
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

    /** Tìm chỉ số của một phòng trong một tháng và nạp sẵn phòng, tòa nhà, người nhập. */
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

    /** Tìm chỉ số theo id cùng toàn bộ dữ liệu liên quan để hiển thị chi tiết. */
    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where reading.id = :id
            """)
    Optional<UtilityReading> findByIdWithDetails(@Param("id") Long id);

    /** Lấy toàn bộ chỉ số điện nước, ưu tiên tháng mới rồi đến thời điểm tạo mới. */
    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findAllWithDetails();

    /** Lấy chỉ số điện nước của một tòa nhà. */
    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where building.id = :buildingId
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy lịch sử chỉ số điện nước của một phòng. */
    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where room.id = :roomId
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findByRoomIdWithDetails(@Param("roomId") Long roomId);

    /**
     * Lịch sử chỉ số thuộc đúng chủ hộ. Không dựa vào phòng hiện tại, vì một phòng
     * có thể đã được bàn giao cho một chủ hộ khác sau khi chỉ số được ghi.
     */
    @Query("""
            select reading from UtilityReading reading
            join fetch reading.room room
            join fetch room.building building
            join fetch reading.createdBy createdBy
            where reading.residentHead.id = :residentHeadId
            order by reading.month desc, reading.createdAt desc
            """)
    List<UtilityReading> findByResidentHeadIdWithDetails(@Param("residentHeadId") Long residentHeadId);
}
