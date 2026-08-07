-- A final utility invoice belongs to the former Head Resident, not to the next tenancy.
-- The old room/month uniqueness would block a regular rent invoice and a final utility
-- invoice from co-existing for the same historical room month.
ALTER TABLE invoices
    ADD COLUMN invoice_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR' AFTER invoice_month;

ALTER TABLE invoices
    DROP INDEX uk_invoices_room_month,
    ADD CONSTRAINT uk_invoices_room_resident_month_type
        UNIQUE (room_id, resident_head_id, invoice_month, invoice_type);
