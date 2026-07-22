package com.tropilot.repository;

import com.tropilot.entity.SepayPayment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SepayPaymentRepository extends JpaRepository<SepayPayment, Long> {

    @EntityGraph(attributePaths = {
            "invoice",
            "invoice.room",
            "invoice.room.building",
            "invoice.residentHead",
            "invoice.createdBy"
    })
    Optional<SepayPayment> findByInvoice_Id(Long invoiceId);

    Optional<SepayPayment> findByPaymentCode(String paymentCode);

    Optional<SepayPayment> findByReferenceCode(String referenceCode);

    void deleteByInvoice_Id(Long invoiceId);
}
