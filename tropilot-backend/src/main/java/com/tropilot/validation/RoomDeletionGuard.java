package com.tropilot.validation;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
/**
 * Hàng rào bảo vệ trước khi xóa phòng.
 * Lớp kiểm tra các bảng nghiệp vụ có thể đang tham chiếu tới phòng để không làm mất hoặc đứt dữ liệu liên quan.
 */
public class RoomDeletionGuard {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Kiểm tra các dữ liệu liên quan như phân phòng, hợp đồng, hóa đơn, task, bảo trì, chỉ số và xe.
     * Chỉ cần một bảng còn bản ghi tham chiếu thì kết quả là true và phòng không nên bị xóa.
     */
    public boolean hasRelatedData(Long roomId) {
        return hasAnyRoomReference(roomId, List.of(
                new RelatedTable("room_assignments", "room_id", "status", "ACTIVE"),
                new RelatedTable("rental_contracts", "room_id", null, null),
                new RelatedTable("room_members", "room_id", null, null),
                new RelatedTable("invoices", "room_id", null, null),
                new RelatedTable("receipts", "room_id", null, null),
                new RelatedTable("tasks", "room_id", null, null),
                new RelatedTable("maintenance_requests", "room_id", null, null),
                new RelatedTable("feedbacks", "room_id", null, null),
                new RelatedTable("utility_readings", "room_id", null, null),
                new RelatedTable("vehicles", "room_id", null, null),
                new RelatedTable("maintenance_requests", "room_id", null, null)
        ));
    }

    /** Duyệt danh sách bảng cần kiểm tra và dừng ngay khi tìm thấy một tham chiếu đến phòng. */
    private boolean hasAnyRoomReference(Long roomId, List<RelatedTable> relatedTables) {
        return relatedTables.stream().anyMatch(table -> hasRows(table, roomId));
    }

    /**
     * Kiểm tra số bản ghi trong một bảng; nếu bảng có cấu hình trạng thái thì chỉ tính bản ghi có trạng thái yêu cầu.
     * Nếu cột cần thiết không tồn tại trong schema hiện tại, bảng đó được bỏ qua để tránh lỗi truy vấn.
     */
    private boolean hasRows(RelatedTable table, Long roomId) {
        if (!hasColumn(table.tableName(), table.roomColumn())) {
            return false;
        }

        if (table.statusColumn() != null && !hasColumn(table.tableName(), table.statusColumn())) {
            return false;
        }

        Integer count = table.statusColumn() == null
                ? jdbcTemplate.queryForObject(
                        "select count(*) from " + table.tableName() + " where " + table.roomColumn() + " = ?",
                        Integer.class,
                        roomId
                )
                : jdbcTemplate.queryForObject(
                        "select count(*) from " + table.tableName()
                                + " where " + table.roomColumn() + " = ? and " + table.statusColumn() + " = ?",
                        Integer.class,
                        roomId,
                        table.activeStatus()
                );

        return count != null && count > 0;
    }

    /** Kiểm tra một cột có tồn tại trong schema cơ sở dữ liệu hiện tại hay không. */
    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = ?
                          and column_name = ?
                        """,
                Integer.class,
                tableName,
                columnName
        );

        return count != null && count > 0;
    }

    /** Mô tả một bảng có thể tham chiếu tới phòng và điều kiện trạng thái tùy chọn khi kiểm tra. */
    private record RelatedTable(String tableName, String roomColumn, String statusColumn, String activeStatus) {
    }
}
