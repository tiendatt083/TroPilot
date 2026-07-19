ALTER TABLE `tasks`
    MODIFY COLUMN `task_type` ENUM(
        'METER_READING',
        'INVOICE_CREATION',
        'ROOM_CHECK',
        'SHARED_EQUIPMENT_CHECK',
        'MAINTENANCE',
        'VEHICLE_CHECK',
        'FEEDBACK_HANDLING',
        'OTHER'
    ) COLLATE utf8mb4_unicode_ci NOT NULL;
