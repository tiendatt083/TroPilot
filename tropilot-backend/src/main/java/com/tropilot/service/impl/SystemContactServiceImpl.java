package com.tropilot.service.impl;

import com.tropilot.dto.request.ContactPhoneRequest;
import com.tropilot.dto.request.SystemContactUpdateRequest;
import com.tropilot.dto.response.ContactPhoneResponse;
import com.tropilot.dto.response.SystemContactResponse;
import com.tropilot.entity.ContactPhone;
import com.tropilot.entity.SystemContact;
import com.tropilot.entity.User;
import com.tropilot.exception.BadRequestException;
import com.tropilot.repository.SystemContactRepository;
import com.tropilot.security.CurrentUserProvider;
import com.tropilot.service.ActivityLogService;
import com.tropilot.service.SystemContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
/** Đọc và cập nhật thông tin liên hệ, số điện thoại trực và khung giờ làm việc của ban quản lý. */
public class SystemContactServiceImpl implements SystemContactService {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    private static final String WORKING_HOURS_SEPARATOR = " - ";

    private final SystemContactRepository systemContactRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional(readOnly = true)
    public SystemContactResponse getContact() {
        return systemContactRepository.findFirstByOrderByIdAsc()
                .map(this::toResponse)
                .orElseGet(this::emptyResponse);
    }

    @Override
    @Transactional
    public SystemContactResponse updateContact(SystemContactUpdateRequest request) {
        User currentUser = currentUserProvider.getCurrentUser();

        validateWorkingHours(request.getWorkingStartTime(), request.getWorkingEndTime());

        List<ContactPhone> phones = normalizePhones(request.getPhones());
        SystemContact contact = systemContactRepository.findFirstByOrderByIdAsc()
                .orElseGet(SystemContact::new);

        contact.setEmail(request.getEmail().trim().toLowerCase(Locale.ROOT));
        contact.setOfficeAddress(request.getOfficeAddress().trim());
        contact.setWorkingHours(formatWorkingHours(
                request.getWorkingStartTime(),
                request.getWorkingEndTime()
        ));
        contact.setPhones(phones);

        SystemContact savedContact = systemContactRepository.save(contact);
        activityLogService.record(
                currentUser,
                "SYSTEM_CONTACT_UPDATED",
                "Updated system contact information"
        );

        return toResponse(savedContact);
    }

    private List<ContactPhone> normalizePhones(List<ContactPhoneRequest> phoneRequests) {
        Set<String> uniquePhoneNumbers = phoneRequests.stream()
                .map(ContactPhoneRequest::getPhoneNumber)
                .map(this::normalizePhoneNumber)
                .collect(Collectors.toSet());

        if (uniquePhoneNumbers.size() != phoneRequests.size()) {
            throw new BadRequestException("Phone numbers must be unique");
        }

        return phoneRequests.stream()
                .map(phone -> ContactPhone.builder()
                        .displayName(phone.getDisplayName().trim())
                        .phoneNumber(phone.getPhoneNumber().trim())
                        .build())
                .collect(Collectors.toCollection(ArrayList::new));
    }

    private SystemContactResponse toResponse(SystemContact contact) {
        WorkingHours workingHours = parseWorkingHours(contact.getWorkingHours());
        List<ContactPhoneResponse> phones = contact.getPhones().stream()
                .map(phone -> ContactPhoneResponse.builder()
                        .displayName(phone.getDisplayName())
                        .phoneNumber(phone.getPhoneNumber())
                        .build())
                .toList();

        return SystemContactResponse.builder()
                .configured(true)
                .email(contact.getEmail())
                .officeAddress(contact.getOfficeAddress())
                .workingHours(contact.getWorkingHours())
                .workingStartTime(workingHours.startTime())
                .workingEndTime(workingHours.endTime())
                .phones(phones)
                .updatedAt(contact.getUpdatedAt())
                .build();
    }

    private SystemContactResponse emptyResponse() {
        return SystemContactResponse.builder()
                .configured(false)
                .phones(List.of())
                .build();
    }

    private String normalizePhoneNumber(String phoneNumber) {
        return phoneNumber.replaceAll("[^0-9+]", "");
    }

    private void validateWorkingHours(LocalTime startTime, LocalTime endTime) {
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Working end time must be after working start time");
        }
    }

    private String formatWorkingHours(LocalTime startTime, LocalTime endTime) {
        return startTime.format(TIME_FORMATTER)
                + WORKING_HOURS_SEPARATOR
                + endTime.format(TIME_FORMATTER);
    }

    private WorkingHours parseWorkingHours(String value) {
        if (value == null || value.isBlank()) {
            return new WorkingHours(null, null);
        }

        String[] parts = value.split("\\s*-\\s*", 2);
        if (parts.length != 2) {
            return new WorkingHours(null, null);
        }

        try {
            return new WorkingHours(
                    LocalTime.parse(parts[0], TIME_FORMATTER),
                    LocalTime.parse(parts[1], TIME_FORMATTER)
            );
        } catch (DateTimeParseException exception) {
            return new WorkingHours(null, null);
        }
    }

    private record WorkingHours(LocalTime startTime, LocalTime endTime) {
    }
}
