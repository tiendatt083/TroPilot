UPDATE notifications
SET event_type = 'MANUAL',
    source = 'SYSTEM'
WHERE event_type IN ('EXPENSE_REQUESTED', 'EXPENSE_APPROVED', 'EXPENSE_REJECTED');

DROP TABLE IF EXISTS expenses;
