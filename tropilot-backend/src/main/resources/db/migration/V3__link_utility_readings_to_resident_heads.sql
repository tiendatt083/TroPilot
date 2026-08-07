-- A meter reading belongs to the Head Resident who occupied the room when it was recorded.
-- This prevents a newly assigned resident from seeing a previous resident's consumption,
-- including when handover occurs in the same calendar month.
ALTER TABLE utility_readings
    ADD COLUMN resident_head_id BIGINT NULL AFTER room_id,
    ADD CONSTRAINT fk_utility_readings_resident_head
        FOREIGN KEY (resident_head_id) REFERENCES users(id),
    ADD INDEX idx_utility_readings_resident_head_month (resident_head_id, reading_month);

-- Existing readings have no reliable historical owner in the old schema, so they remain
-- NULL rather than being guessed and exposed to a new tenant. They are still available to
-- administrators and are still used by the invoices already linked to the room/month.
