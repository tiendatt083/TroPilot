package com.tropilot.repository;

import com.tropilot.entity.RoomMember;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.RoomMemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository quản lý các thành viên sống cùng chủ hộ trong phòng.
 * Hỗ trợ lọc thành viên theo phòng, tòa nhà, trạng thái phê duyệt và kiểm tra sức chứa.
 */
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {

    /** Lấy thành viên của một phòng có trạng thái nằm trong danh sách truyền vào. */
    List<RoomMember> findByRoom_IdAndStatusIn(Long roomId, Collection<RoomMemberStatus> statuses);

    /** Đếm thành viên theo phòng, chủ hộ và trạng thái để tính số người đang ở. */
    long countByRoom_IdAndResidentHead_IdAndStatus(Long roomId, Long residentHeadId, RoomMemberStatus status);

    /** Đếm thành viên theo trạng thái nhưng chỉ khi chủ hộ của họ còn phân phòng đang hiệu lực. */
    @Query("""
            select count(member) from RoomMember member
            where member.status = :memberStatus
              and exists (
                  select assignment.id from RoomAssignment assignment
                  where assignment.room = member.room
                    and assignment.residentHead = member.residentHead
                    and assignment.status = :assignmentStatus
              )
            """)
    long countByStatusWithActiveAssignment(
            @Param("memberStatus") RoomMemberStatus memberStatus,
            @Param("assignmentStatus") RoomAssignmentStatus assignmentStatus
    );

    /** Kiểm tra tên thành viên có bị trùng (không phân biệt hoa thường) trong một phòng/chủ hộ/trạng thái hay không. */
    boolean existsByRoom_IdAndResidentHead_IdAndStatusAndFullNameIgnoreCase(
            Long roomId,
            Long residentHeadId,
            RoomMemberStatus status,
            String fullName
    );

    /** Tìm thành viên theo id và nạp thông tin phòng, tòa nhà, chủ hộ. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where member.id = :id
            """)
    Optional<RoomMember> findByIdWithDetails(@Param("id") Long id);

    /** Lấy thành viên của một phòng theo các trạng thái, với đầy đủ thông tin hiển thị. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where room.id = :roomId
              and member.status in :statuses
            order by member.createdAt desc
            """)
    List<RoomMember> findByRoomIdAndStatusInWithDetails(
            @Param("roomId") Long roomId,
            @Param("statuses") Collection<RoomMemberStatus> statuses
    );

    /** Lấy tất cả thành viên do một chủ hộ đăng ký trong một phòng. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where room.id = :roomId
              and residentHead.id = :residentHeadId
            order by member.createdAt desc
            """)
    List<RoomMember> findByRoomIdAndResidentHeadIdWithDetails(
            @Param("roomId") Long roomId,
            @Param("residentHeadId") Long residentHeadId
    );

    /** Lấy các thành viên thuộc các phòng của một tòa nhà. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where building.id = :buildingId
            order by member.createdAt desc
            """)
    List<RoomMember> findByBuildingIdWithDetails(@Param("buildingId") Long buildingId);

    /** Lấy tất cả thành viên theo trạng thái, kèm phòng/tòa nhà/chủ hộ. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where member.status = :status
            order by member.createdAt desc
            """)
    List<RoomMember> findByStatusWithDetails(@Param("status") RoomMemberStatus status);

    /** Lấy thành viên theo trạng thái trong phạm vi một tòa nhà. */
    @Query("""
            select member from RoomMember member
            join fetch member.room room
            join fetch room.building building
            join fetch member.residentHead residentHead
            where building.id = :buildingId
              and member.status = :status
            order by member.createdAt desc
            """)
    List<RoomMember> findByBuildingIdAndStatusWithDetails(
            @Param("buildingId") Long buildingId,
            @Param("status") RoomMemberStatus status
    );
}
