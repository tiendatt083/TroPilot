package com.tropilot.repository;

import com.tropilot.entity.RentalContract;
import com.tropilot.enums.RentalStatus;
import com.tropilot.enums.RoomAssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý hợp đồng thuê phòng.
 * Các truy vấn "WithDetails" lấy kèm phòng, tòa nhà và chủ hộ, đồng thời kiểm tra phân phòng còn hiệu lực khi cần.
 */
public interface RentalContractRepository extends JpaRepository<RentalContract, Long> {

    /** Đếm hợp đồng có trạng thái thuê xác định và ngày kết thúc nằm trong một khoảng thời gian. */
    long countByRentalStatusAndEndDateBetween(RentalStatus rentalStatus, LocalDate startDate, LocalDate endDate);

    /** Kiểm tra tệp hợp đồng có thuộc về hợp đồng của một chủ hộ hay không. */
    boolean existsByContractFileUrlInAndResidentHead_Id(Collection<String> contractFileUrls, Long residentHeadId);

    /** Lấy các hợp đồng theo trạng thái thuê khi phòng/chủ hộ vẫn có phân phòng đúng trạng thái. */
    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            order by contract.createdAt desc
            """)
    List<RentalContract> findByRentalStatusAndAssignmentStatusWithDetails(
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    /** Lấy hợp đồng theo trạng thái thuê và phân phòng hiện tại trong phạm vi một tòa nhà. */
    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where building.id = :buildingId
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            order by contract.createdAt desc
            """)
    List<RentalContract> findByBuildingIdAndRentalStatusAndAssignmentStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    /** Tìm một hợp đồng theo id, chỉ trả về khi trạng thái hợp đồng và phân phòng cùng thỏa điều kiện. */
    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.id = :id
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
              )
            """)
    Optional<RentalContract> findByIdAndRentalStatusAndAssignmentStatusWithDetails(
            @Param("id") Long id,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    /** Tìm hợp đồng theo id cùng dữ liệu phòng, tòa nhà và chủ hộ. */
    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where contract.id = :id
            """)
    Optional<RentalContract> findByIdWithDetails(@Param("id") Long id);

    /** Lấy hợp đồng mới nhất của một phòng/chủ hộ theo trạng thái thuê. */
    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdAndRentalStatusOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId,
            RentalStatus rentalStatus
    );

    /** Lấy hợp đồng mới nhất của một phòng và chủ hộ, không lọc trạng thái thuê. */
    Optional<RentalContract> findFirstByRoom_IdAndResidentHead_IdOrderByCreatedAtDesc(
            Long roomId,
            Long residentHeadId
    );

    /** Lấy các hợp đồng hiện tại của một chủ hộ, với điều kiện phân phòng vẫn còn hiệu lực. */
    @Query("""
            select contract from RentalContract contract
            join fetch contract.room room
            join fetch room.building building
            join fetch contract.residentHead residentHead
            where residentHead.id = :residentHeadId
              and contract.rentalStatus = :rentalStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = contract.room
                    and assignment.residentHead = contract.residentHead
                    and assignment.status = :assignmentStatus
            )
            order by contract.createdAt desc
            """)
    List<RentalContract> findCurrentByResidentHeadIdWithDetails(
            @Param("residentHeadId") Long residentHeadId,
            @Param("rentalStatus") RentalStatus rentalStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );
}
