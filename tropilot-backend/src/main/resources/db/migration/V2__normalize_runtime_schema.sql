-- Replaces the former SchemaMaintenanceRunner and completes invoice date normalization.
ALTER TABLE notifications
    MODIFY target_type VARCHAR(40) NOT NULL;

ALTER TABLE maintenance_requests
    MODIFY room_id BIGINT NULL,
    MODIFY resident_head_id BIGINT NULL;

UPDATE invoices
SET invoice_date = DATE(created_at)
WHERE invoice_date IS NULL;

ALTER TABLE invoices
    MODIFY invoice_date DATE NOT NULL;
