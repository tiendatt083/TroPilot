package com.tropilot.validation;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
/**
 * Kiểm tra một tòa nhà còn phòng tham chiếu đến nó hay không trước khi cho phép xóa tòa nhà.
 * Lớp cũng tương thích với schema cũ chưa có cột rooms.building_id.
 */
public class RoomReferenceChecker {

    private final JdbcTemplate jdbcTemplate;

    /** Trả về true nếu có ít nhất một phòng thuộc tòa nhà được truyền vào. */
    public boolean hasRooms(Long buildingId) {
        if (!roomsTableHasBuildingColumn()) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from rooms where building_id = ?",
                Integer.class,
                buildingId
        );

        return count != null && count > 0;
    }

    /** Kiểm tra cột rooms.building_id tồn tại để tránh lỗi SQL trên dữ liệu/schema cũ. */
    private boolean roomsTableHasBuildingColumn() {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'rooms'
                          and column_name = 'building_id'
                        """,
                Integer.class
        );

        return count != null && count > 0;
    }
}
