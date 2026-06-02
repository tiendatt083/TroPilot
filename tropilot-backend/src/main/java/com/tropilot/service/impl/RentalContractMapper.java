package com.tropilot.service.impl;

import com.tropilot.dto.response.ContractFileHistoryResponse;
import com.tropilot.dto.response.RentalContractResponse;
import com.tropilot.entity.Building;
import com.tropilot.entity.RentalContract;
import com.tropilot.entity.RentalContractFileHistory;
import com.tropilot.entity.Room;
import com.tropilot.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RentalContractMapper {

    public RentalContractResponse toResponse(RentalContract contract) {
        return toResponse(contract, List.of());
    }

    public RentalContractResponse toResponse(RentalContract contract, List<RentalContractFileHistory> previousFiles) {
        Room room = contract.getRoom();
        Building building = room.getBuilding();
        User residentHead = contract.getResidentHead();

        return RentalContractResponse.builder()
                .id(contract.getId())
                .roomId(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .buildingId(building.getId())
                .buildingCode(building.getBuildingCode())
                .buildingName(building.getName())
                .residentHeadId(residentHead.getId())
                .residentHeadName(residentHead.getFullName())
                .residentHeadEmail(residentHead.getEmail())
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .depositAmount(contract.getDepositAmount())
                .rentalStatus(contract.getRentalStatus())
                .contractFileUrl(contract.getContractFileUrl())
                .contractStatus(contract.getContractStatus())
                .previousContractFiles(toHistoryResponses(previousFiles))
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }

    private List<ContractFileHistoryResponse> toHistoryResponses(List<RentalContractFileHistory> previousFiles) {
        if (previousFiles == null || previousFiles.isEmpty()) {
            return List.of();
        }

        return previousFiles.stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    private ContractFileHistoryResponse toHistoryResponse(RentalContractFileHistory history) {
        User replacedBy = history.getReplacedBy();

        return ContractFileHistoryResponse.builder()
                .id(history.getId())
                .fileUrl(history.getFileUrl())
                .replacedById(replacedBy.getId())
                .replacedByName(replacedBy.getFullName())
                .replacedAt(history.getReplacedAt())
                .build();
    }
}
