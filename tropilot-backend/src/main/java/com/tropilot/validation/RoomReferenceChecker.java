package com.tropilot.validation;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoomReferenceChecker {

    private final JdbcTemplate jdbcTemplate;

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
