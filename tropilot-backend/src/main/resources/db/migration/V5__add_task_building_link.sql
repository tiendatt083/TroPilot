ALTER TABLE tasks
    ADD COLUMN building_id BIGINT NULL;

UPDATE tasks task_entity
JOIN rooms room ON task_entity.room_id = room.id
SET task_entity.building_id = room.building_id
WHERE task_entity.building_id IS NULL;

ALTER TABLE tasks
    ADD INDEX idx_tasks_building_id (building_id),
    ADD CONSTRAINT fk_tasks_building
        FOREIGN KEY (building_id) REFERENCES buildings (id);
