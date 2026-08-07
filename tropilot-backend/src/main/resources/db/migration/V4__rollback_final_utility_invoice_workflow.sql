-- Roll back the discontinued final-utility-invoice workflow.
-- Delete only the trial FINAL_UTILITY invoices and their dependent records before
-- restoring the original room/month invoice constraint.
DELETE f
FROM feedbacks f
INNER JOIN invoices i ON i.id = f.invoice_id
WHERE i.invoice_type = 'FINAL_UTILITY';

DELETE ii
FROM invoice_items ii
INNER JOIN invoices i ON i.id = ii.invoice_id
WHERE i.invoice_type = 'FINAL_UTILITY';

DELETE p
FROM payments p
INNER JOIN invoices i ON i.id = p.invoice_id
WHERE i.invoice_type = 'FINAL_UTILITY';

DELETE r
FROM receipts r
INNER JOIN invoices i ON i.id = r.invoice_id
WHERE i.invoice_type = 'FINAL_UTILITY';

DELETE sp
FROM sepay_payments sp
INNER JOIN invoices i ON i.id = sp.invoice_id
WHERE i.invoice_type = 'FINAL_UTILITY';

DELETE FROM invoices
WHERE invoice_type = 'FINAL_UTILITY';

-- Restore the original schema used before the discontinued workflow.
ALTER TABLE invoices
    DROP INDEX uk_invoices_room_resident_month_type,
    DROP COLUMN invoice_type,
    ADD CONSTRAINT uk_invoices_room_month UNIQUE (room_id, invoice_month);

ALTER TABLE utility_readings
    DROP FOREIGN KEY fk_utility_readings_resident_head,
    DROP INDEX idx_utility_readings_resident_head_month,
    DROP COLUMN resident_head_id;
