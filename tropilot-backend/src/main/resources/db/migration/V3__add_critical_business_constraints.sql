-- Invoice and utility reading uniqueness.
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'invoices'
      AND index_name = 'uk_invoices_room_month'
);
SET @statement = IF(
    @index_exists = 0,
    'ALTER TABLE invoices ADD CONSTRAINT uk_invoices_room_month UNIQUE (room_id, invoice_month)',
    'SELECT 1'
);
PREPARE migration_statement FROM @statement;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'utility_readings'
      AND index_name = 'uk_utility_readings_room_month'
);
SET @statement = IF(
    @index_exists = 0,
    'ALTER TABLE utility_readings ADD CONSTRAINT uk_utility_readings_room_month UNIQUE (room_id, reading_month)',
    'SELECT 1'
);
PREPARE migration_statement FROM @statement;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

-- MySQL permits multiple NULL values in a unique index. Generated columns therefore
-- enforce uniqueness only while an assignment or utility fee is active.
ALTER TABLE room_assignments
    ADD COLUMN active_room_id BIGINT
        GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN room_id ELSE NULL END) STORED,
    ADD COLUMN active_resident_head_id BIGINT
        GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN resident_head_id ELSE NULL END) STORED;

ALTER TABLE room_assignments
    ADD CONSTRAINT uk_room_assignments_active_room UNIQUE (active_room_id),
    ADD CONSTRAINT uk_room_assignments_active_resident_head UNIQUE (active_resident_head_id);

ALTER TABLE service_fees
    ADD COLUMN active_electricity_building_id BIGINT
        GENERATED ALWAYS AS (
            CASE WHEN is_active = 1 AND fee_type = 'ELECTRICITY' THEN building_id ELSE NULL END
        ) STORED,
    ADD COLUMN active_water_building_id BIGINT
        GENERATED ALWAYS AS (
            CASE WHEN is_active = 1 AND fee_type = 'WATER' THEN building_id ELSE NULL END
        ) STORED;

ALTER TABLE service_fees
    ADD CONSTRAINT uk_service_fees_active_electricity UNIQUE (active_electricity_building_id),
    ADD CONSTRAINT uk_service_fees_active_water UNIQUE (active_water_building_id);
