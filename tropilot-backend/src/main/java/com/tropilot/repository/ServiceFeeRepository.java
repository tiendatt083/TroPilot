package com.tropilot.repository;

import com.tropilot.entity.ServiceFee;
import com.tropilot.enums.FeeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository quản lý cấu hình các khoản phí và dịch vụ của từng tòa nhà.
 */
public interface ServiceFeeRepository extends JpaRepository<ServiceFee, Long> {

    /** Kiểm tra mã phí đã tồn tại trong một tòa nhà hay chưa. */
    boolean existsByBuilding_IdAndFeeCode(Long buildingId, String feeCode);

    /** Kiểm tra tòa nhà đã có khoản phí đang hoạt động thuộc loại này hay chưa. */
    boolean existsByBuilding_IdAndFeeTypeAndIsActiveTrue(Long buildingId, FeeType feeType);

    /** Kiểm tra trùng loại phí đang hoạt động khi cập nhật, bỏ qua chính bản ghi hiện tại. */
    boolean existsByBuilding_IdAndFeeTypeAndIsActiveTrueAndIdNot(Long buildingId, FeeType feeType, Long id);

    /** Lấy các khoản phí còn áp dụng của một tòa nhà, mới tạo trước. */
    List<ServiceFee> findByBuilding_IdAndIsActiveTrueOrderByCreatedAtDesc(Long buildingId);

    /** Lấy toàn bộ khoản phí của một tòa nhà, gồm cả phí đã ngừng áp dụng. */
    List<ServiceFee> findByBuilding_IdOrderByCreatedAtDesc(Long buildingId);
}
