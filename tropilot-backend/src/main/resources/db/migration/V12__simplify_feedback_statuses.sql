UPDATE feedbacks
SET status = 'IN_PROGRESS'
WHERE status = 'ASSIGNED';

UPDATE feedbacks
SET status = 'RESOLVED'
WHERE status = 'REJECTED';

ALTER TABLE feedbacks
    MODIFY COLUMN `status` ENUM('PENDING','IN_PROGRESS','RESOLVED') NOT NULL;
