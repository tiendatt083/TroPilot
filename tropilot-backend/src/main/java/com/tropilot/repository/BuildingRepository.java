package com.tropilot.repository;

import com.tropilot.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BuildingRepository extends JpaRepository<Building, Long> {

    Optional<Building> findByBuildingCode(String buildingCode);

    boolean existsByBuildingCode(String buildingCode);

    List<Building> findAllByOrderByCreatedAtDesc();

    @Query("""
            select building from Building building
            where lower(building.buildingCode) like lower(concat('%', :search, '%'))
               or lower(building.name) like lower(concat('%', :search, '%'))
            order by building.createdAt desc
            """)
    List<Building> searchByCodeOrName(@Param("search") String search);
}
