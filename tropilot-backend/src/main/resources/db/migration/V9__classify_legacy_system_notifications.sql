UPDATE notifications
SET source = 'SYSTEM',
    event_type = CASE
        WHEN title IN ('New invoice issued', 'Đã tạo hóa đơn mới') THEN 'INVOICE_ISSUED'
        WHEN title IN ('Payment received', 'Đã nhận thanh toán', 'Thanh toán đã được xác nhận') THEN 'PAYMENT_RECEIVED'
        WHEN title = 'Thanh toán chưa được chấp nhận' THEN 'PAYMENT_REJECTED'
        WHEN title = 'Có thanh toán cần xác nhận' THEN 'PAYMENT_SUBMITTED'
        WHEN title IN ('Rental contract updated', 'Đã cập nhật hợp đồng thuê') THEN 'CONTRACT_UPDATED'
        WHEN title IN ('Có phản hồi mới', 'Có khiếu nại hóa đơn mới') THEN 'FEEDBACK_CREATED'
        WHEN title IN ('Trạng thái phản hồi đã thay đổi', 'Yêu cầu của bạn đã được xử lý') THEN 'FEEDBACK_UPDATED'
        WHEN title = 'Bạn có công việc mới' THEN 'TASK_ASSIGNED'
        WHEN title = 'Nhân viên đã hoàn thành công việc' THEN 'TASK_COMPLETED'
        WHEN title = 'Nhân viên từ chối công việc' THEN 'TASK_REJECTED'
        WHEN title = 'Nhân viên gửi yêu cầu chi phí' THEN 'EXPENSE_REQUESTED'
        WHEN title = 'Yêu cầu chi phí đã được duyệt' THEN 'EXPENSE_APPROVED'
        WHEN title = 'Yêu cầu chi phí không được duyệt' THEN 'EXPENSE_REJECTED'
        WHEN title = 'Có yêu cầu thêm thành viên' THEN 'MEMBER_REQUESTED'
        WHEN title = 'Yêu cầu thành viên đã được duyệt' THEN 'MEMBER_APPROVED'
        WHEN title = 'Yêu cầu thành viên bị từ chối' THEN 'MEMBER_REJECTED'
        ELSE event_type
    END
WHERE source = 'MANUAL'
  AND event_type = 'MANUAL'
  AND title IN (
      'New invoice issued',
      'Đã tạo hóa đơn mới',
      'Payment received',
      'Đã nhận thanh toán',
      'Thanh toán đã được xác nhận',
      'Thanh toán chưa được chấp nhận',
      'Có thanh toán cần xác nhận',
      'Rental contract updated',
      'Đã cập nhật hợp đồng thuê',
      'Có phản hồi mới',
      'Có khiếu nại hóa đơn mới',
      'Trạng thái phản hồi đã thay đổi',
      'Yêu cầu của bạn đã được xử lý',
      'Bạn có công việc mới',
      'Nhân viên đã hoàn thành công việc',
      'Nhân viên từ chối công việc',
      'Nhân viên gửi yêu cầu chi phí',
      'Yêu cầu chi phí đã được duyệt',
      'Yêu cầu chi phí không được duyệt',
      'Có yêu cầu thêm thành viên',
      'Yêu cầu thành viên đã được duyệt',
      'Yêu cầu thành viên bị từ chối'
  );
