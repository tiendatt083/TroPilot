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
