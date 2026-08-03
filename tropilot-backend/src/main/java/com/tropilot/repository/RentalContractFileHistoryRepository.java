package com.tropilot.repository;

import com.tropilot.entity.RentalContractFileHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

/**
 * Repository lưu lịch sử các tệp hợp đồng đã được thay thế.
 * Dữ liệu này giúp vẫn có thể xem hoặc kiểm tra các phiên bản hợp đồng cũ.
 */
public interface RentalContractFileHistoryRepository extends JpaRepository<RentalContractFileHistory, Long> {

    /** Lấy các tệp hợp đồng cũ theo thứ tự thay thế mới nhất, kèm người đã thay tệp. */
    @EntityGraph(attributePaths = {"replacedBy"})
    List<RentalContractFileHistory> findByRentalContract_IdOrderByReplacedAtDesc(Long rentalContractId);

    /** Kiểm tra các URL tệp có thuộc lịch sử hợp đồng của một chủ hộ cụ thể hay không. */
    boolean existsByFileUrlInAndRentalContract_ResidentHead_Id(Collection<String> fileUrls, Long residentHeadId);
}
