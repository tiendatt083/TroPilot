ALTER TABLE feedbacks
    MODIFY COLUMN `type` ENUM('GENERAL','MAINTENANCE','INVOICE_COMPLAINT','CONTRACT_ERROR','OTHER') NOT NULL,
    MODIFY COLUMN `status` ENUM('PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL;

ALTER TABLE tasks
    ADD COLUMN feedback_id BIGINT NULL;

ALTER TABLE tasks
    ADD INDEX idx_tasks_feedback_id (feedback_id),
    ADD CONSTRAINT fk_tasks_feedback
        FOREIGN KEY (feedback_id) REFERENCES feedbacks (id);
