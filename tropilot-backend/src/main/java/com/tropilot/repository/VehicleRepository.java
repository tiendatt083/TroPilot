package com.tropilot.repository;

import com.tropilot.entity.Vehicle;
import com.tropilot.enums.VehicleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    boolean existsByLicensePlateAndStatus(String licensePlate, VehicleStatus status);

    boolean existsByLicensePlateAndStatusAndIdNot(String licensePlate, VehicleStatus status, Long id);

    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where vehicle.id = :id
            """)
    Optional<Vehicle> findByIdWithDetails(@Param("id") Long id);

    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findAllWithDetails();

    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where vehicle.status = :status
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByStatusWithDetails(@Param("status") VehicleStatus status);

    @Query("""
            select vehicle from Vehicle vehicle
            join fetch vehicle.room room
            join fetch room.building building
            where room.id = :roomId
            order by vehicle.createdAt desc
            """)
    List<Vehicle> findByRoomIdWithDetails(@Param("roomId") Long roomId);
}
