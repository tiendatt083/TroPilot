package com.tropilot.service.impl;

import com.tropilot.config.UploadProperties;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.security.access.AccessDeniedException;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UploadedFileServiceImplTest {

    @TempDir
    Path uploadDirectory;

    @Test
    void adminCanLoadExistingUploadedFile() throws Exception {
        Path contractDirectory = Files.createDirectories(uploadDirectory.resolve("contracts"));
        Files.writeString(contractDirectory.resolve("contract.pdf"), "contract");
        UploadedFileServiceImpl service = service();
        AuthenticatedUser admin = mockUser(UserRole.ADMIN, 1L);

        UploadedFileService.AuthorizedFile file = service.load("/uploads/contracts/contract.pdf", admin);

        assertThat(file.filename()).isEqualTo("contract.pdf");
        assertThat(file.resource().exists()).isTrue();
    }

    @Test
    void traversalPathIsRejectedBeforeFileLookup() {
        UploadedFileServiceImpl service = service();
        AuthenticatedUser admin = mockUser(UserRole.ADMIN, 1L);

        assertThatThrownBy(() -> service.load("/uploads/contracts/../secret.txt", admin))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void residentCannotLoadUnrelatedFile() throws Exception {
        Path contractDirectory = Files.createDirectories(uploadDirectory.resolve("contracts"));
        Files.writeString(contractDirectory.resolve("contract.pdf"), "contract");
        UploadedFileServiceImpl service = service();
        AuthenticatedUser resident = mockUser(UserRole.RESIDENT_HEAD, 2L);

        assertThatThrownBy(() -> service.load("/uploads/contracts/contract.pdf", resident))
                .isInstanceOf(AccessDeniedException.class);
    }

    private UploadedFileServiceImpl service() {
        UploadProperties uploadProperties = new UploadProperties();
        uploadProperties.setBasePath(uploadDirectory.toString());

        return new UploadedFileServiceImpl(
                uploadProperties,
                mock(RentalContractRepository.class),
                mock(RentalContractFileHistoryRepository.class),
                mock(PaymentRepository.class),
                mock(MaintenanceRequestRepository.class),
                mock(TaskRepository.class),
                mock(UtilityReadingRepository.class),
                mock(RoomAssignmentRepository.class)
        );
    }

    private AuthenticatedUser mockUser(UserRole role, Long id) {
        AuthenticatedUser user = mock(AuthenticatedUser.class);
        when(user.getRole()).thenReturn(role);
        when(user.getId()).thenReturn(id);
        return user;
    }
}
