package com.tropilot.service.impl;

import com.tropilot.config.UploadProperties;
import com.tropilot.enums.RoomAssignmentStatus;
import com.tropilot.enums.UserRole;
import com.tropilot.exception.ResourceNotFoundException;
import com.tropilot.repository.MaintenanceRequestRepository;
import com.tropilot.repository.PaymentRepository;
import com.tropilot.repository.RentalContractFileHistoryRepository;
import com.tropilot.repository.RentalContractRepository;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.TaskRepository;
import com.tropilot.repository.UtilityReadingRepository;
import com.tropilot.security.AuthenticatedUser;
import com.tropilot.service.UploadedFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
/** Nạp tệp đã lưu và kiểm tra người dùng hiện tại có quyền đọc tệp theo thư mục/nghiệp vụ hay không. */
public class UploadedFileServiceImpl implements UploadedFileService {

    private static final Set<String> ALLOWED_DIRECTORIES = Set.of(
            "contracts",
            "payments",
            "maintenance",
            "tasks",
            "utility-readings"
    );

    private final UploadProperties uploadProperties;
    private final RentalContractRepository rentalContractRepository;
    private final RentalContractFileHistoryRepository rentalContractFileHistoryRepository;
    private final PaymentRepository paymentRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final TaskRepository taskRepository;
    private final UtilityReadingRepository utilityReadingRepository;
    private final RoomAssignmentRepository roomAssignmentRepository;

    @Override
    /** Chuẩn hóa đường dẫn, kiểm tra quyền theo role rồi trả resource và loại nội dung của tệp. */
    public AuthorizedFile load(String rawPath, AuthenticatedUser user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication is required");
        }

        String relativePath = normalizeRelativePath(rawPath);
        Path basePath = Path.of(uploadProperties.getBasePath()).toAbsolutePath().normalize();
        Path filePath = basePath.resolve(relativePath).normalize();

        if (!filePath.startsWith(basePath) || !Files.isRegularFile(filePath)) {
            throw new ResourceNotFoundException("File not found");
        }

        if (!canAccess(relativePath, user)) {
            throw new AccessDeniedException("Access denied");
        }

        Resource resource = new FileSystemResource(filePath);
        return new AuthorizedFile(resource, contentType(filePath), filePath.getFileName().toString());
    }

    private String normalizeRelativePath(String rawPath) {
        if (rawPath == null || rawPath.isBlank()) {
            throw new ResourceNotFoundException("File not found");
        }

        String decodedPath = URLDecoder.decode(rawPath, StandardCharsets.UTF_8).replace('\\', '/');
        while (decodedPath.startsWith("/")) {
            decodedPath = decodedPath.substring(1);
        }
        if (decodedPath.startsWith("uploads/")) {
            decodedPath = decodedPath.substring("uploads/".length());
        }

        Path normalizedPath = Path.of(decodedPath).normalize();
        if (normalizedPath.isAbsolute()
                || normalizedPath.startsWith("..")
                || normalizedPath.getNameCount() < 2
                || decodedPath.contains(":")) {
            throw new ResourceNotFoundException("File not found");
        }

        String directory = normalizedPath.getName(0).toString();
        if (!ALLOWED_DIRECTORIES.contains(directory)) {
            throw new ResourceNotFoundException("File not found");
        }

        return normalizedPath.toString().replace('\\', '/');
    }

    private boolean canAccess(String relativePath, AuthenticatedUser user) {
        if (user.getRole() == UserRole.ADMIN) {
            return true;
        }

        String directory = relativePath.substring(0, relativePath.indexOf('/'));
        Set<String> urls = candidateStoredUrls(relativePath);

        return switch (user.getRole()) {
            case STAFF -> canStaffAccess(directory, urls, user.getId());
            case RESIDENT_HEAD -> canResidentAccess(directory, urls, user.getId());
            default -> false;
        };
    }

    private boolean canStaffAccess(String directory, Collection<String> urls, Long staffId) {
        return switch (directory) {
            case "payments" -> paymentRepository.existsByProofImageUrlIn(urls);
            case "maintenance" -> maintenanceRequestRepository.existsByAnyImageUrlInAndAssignedToId(urls, staffId);
            case "tasks" -> taskRepository.existsByResultImageUrlInAndAssignedToId(urls, staffId);
            case "utility-readings" -> utilityReadingRepository.existsByAnyImageUrlIn(urls);
            default -> false;
        };
    }

    private boolean canResidentAccess(String directory, Collection<String> urls, Long residentHeadId) {
        return switch (directory) {
            case "contracts" -> rentalContractRepository.existsByContractFileUrlInAndResidentHead_Id(urls, residentHeadId)
                    || rentalContractFileHistoryRepository.existsByFileUrlInAndRentalContract_ResidentHead_Id(
                    urls,
                    residentHeadId
            );
            case "payments" -> paymentRepository.existsByProofImageUrlInAndResidentHead_Id(urls, residentHeadId);
            case "maintenance" -> maintenanceRequestRepository.existsByAnyImageUrlInAndResidentHeadId(
                    urls,
                    residentHeadId
            );
            case "tasks" -> residentRoomId(residentHeadId)
                    .map(roomId -> taskRepository.existsByResultImageUrlInAndResidentAccess(urls, roomId, residentHeadId))
                    .orElse(false);
            case "utility-readings" -> residentRoomId(residentHeadId)
                    .map(roomId -> utilityReadingRepository.existsByAnyImageUrlInAndRoomId(urls, roomId))
                    .orElse(false);
            default -> false;
        };
    }

    private Optional<Long> residentRoomId(Long residentHeadId) {
        return roomAssignmentRepository.findByResidentHeadIdAndStatus(residentHeadId, RoomAssignmentStatus.ACTIVE)
                .map(assignment -> assignment.getRoom().getId());
    }

    private Set<String> candidateStoredUrls(String relativePath) {
        String storedPath = "/uploads/" + relativePath;
        Set<String> urls = new LinkedHashSet<>();
        urls.add(storedPath);
        urls.add(storedPath.substring(1));

        try {
            urls.add(ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(storedPath)
                    .toUriString());
        } catch (IllegalStateException ignored) {
            // Unit tests may call this service without a bound servlet request.
        }

        return urls;
    }

    private MediaType contentType(Path filePath) {
        try {
            String detectedType = Files.probeContentType(filePath);
            if (detectedType != null) {
                return MediaType.parseMediaType(detectedType);
            }
        } catch (IOException ignored) {
            // Fall back to binary when the platform cannot detect the type.
        }

        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
