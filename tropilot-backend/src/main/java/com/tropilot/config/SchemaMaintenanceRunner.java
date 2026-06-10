package com.tropilot.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaMaintenanceRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        normalizeNotificationTargetTypeColumn();
        allowBuildingEquipmentMaintenanceRequests();
    }

    private void allowBuildingEquipmentMaintenanceRequests() {
        if (!tableExists("maintenance_requests")) {
            return;
        }

        makeColumnNullable("maintenance_requests", "room_id");
        makeColumnNullable("maintenance_requests", "resident_head_id");
    }

    private void makeColumnNullable(String tableName, String columnName) {
        if (!columnExists(tableName, columnName) || columnIsNullable(tableName, columnName)) {
            return;
        }

        String columnType = jdbcTemplate.queryForObject(
                """
                        select column_type
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = ?
                          and column_name = ?
                        """,
                String.class,
                tableName,
                columnName
        );

        if (columnType != null && columnType.matches("[A-Za-z0-9(), ]+")) {
            jdbcTemplate.execute(
                    "ALTER TABLE " + tableName + " MODIFY " + columnName + " " + columnType + " NULL"
            );
            log.info("Column {}.{} now accepts null values.", tableName, columnName);
        }
    }

    private void normalizeNotificationTargetTypeColumn() {
        if (!tableExists("notifications") || !columnExists("notifications", "target_type")) {
            return;
        }

        if (notificationTargetTypeColumnNeedsNormalization()) {
            jdbcTemplate.execute("ALTER TABLE notifications MODIFY target_type VARCHAR(40) NOT NULL");
            log.info("Notification target_type column is normalized.");
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                        select count(*)
                        from information_schema.tables
                        where table_schema = database()
                          and table_name = ?
                        """,
                Integer.class,
                tableName
        );
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
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

    private boolean columnIsNullable(String tableName, String columnName) {
        String nullable = jdbcTemplate.queryForObject(
                """
                        select is_nullable
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = ?
                          and column_name = ?
                        """,
                String.class,
                tableName,
                columnName
        );
        return "YES".equalsIgnoreCase(nullable);
    }

    private boolean notificationTargetTypeColumnNeedsNormalization() {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                """
                        select case
                            when data_type <> 'varchar' then true
                            when character_maximum_length < 40 then true
                            else false
                        end
                        from information_schema.columns
                        where table_schema = database()
                          and table_name = 'notifications'
                          and column_name = 'target_type'
                        """,
                Boolean.class
        ));
    }
}
