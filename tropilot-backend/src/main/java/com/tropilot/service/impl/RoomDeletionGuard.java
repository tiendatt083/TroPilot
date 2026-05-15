package com.tropilot.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoomDeletionGuard {

    private final JdbcTemplate jdbcTemplate;

    public boolean hasRelatedData(Long roomId) {
        return hasAnyRoomReference(roomId, List.of(
                new RelatedTable("room_assignments", "room_id", "status", "ACTIVE"),
                new RelatedTable("rental_contracts", "room_id", null, null),
                new RelatedTable("room_members", "room_id", null, null),
                new RelatedTable("invoices", "room_id", null, null),
                new RelatedTable("receipts", "room_id", null, null),
                new RelatedTable("expenses", "room_id", null, null),
                new RelatedTable("tasks", "room_id", null, null),
                new RelatedTable("maintenance_requests", "room_id", null, null),
                new RelatedTable("utility_readings", "room_id", null, null),
                new RelatedTable("vehicles", "room_id", null, null),
                new RelatedTable("maintenance_requests", "room_id", null, null)
        ));
    }

    private boolean hasAnyRoomReference(Long roomId, List<RelatedTable> relatedTables) {
        return relatedTables.stream().anyMatch(table -> hasRows(table, roomId));
    }

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

    private record RelatedTable(String tableName, String roomColumn, String statusColumn, String activeStatus) {
    }
}
