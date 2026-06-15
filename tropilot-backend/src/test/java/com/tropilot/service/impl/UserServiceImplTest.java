package com.tropilot.service.impl;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.response.UserResponse;
import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.exception.BadRequestException;
import com.tropilot.mapper.UserMapper;
import com.tropilot.repository.RoomAssignmentRepository;
import com.tropilot.repository.UserRepository;
import com.tropilot.service.ActivityLogService;
import com.tropilot.util.TemporaryPasswordCipher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomAssignmentRepository roomAssignmentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private TemporaryPasswordCipher temporaryPasswordCipher;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private UserServiceImpl service;

    @Test
    void createUserReleasesEmailOwnedByInactiveAccount() {
        User inactiveUser = user(10L, "resident@example.com", UserStatus.INACTIVE);
        AdminCreateUserRequest request = createRequest("resident@example.com");
        UserResponse mappedResponse = UserResponse.builder().id(20L).email(request.getEmail()).build();

        when(userRepository.findByEmail("resident@example.com")).thenReturn(Optional.of(inactiveUser));
        when(passwordEncoder.encode(any())).thenReturn("encoded-password");
        when(temporaryPasswordCipher.encrypt(any())).thenReturn("encrypted-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            savedUser.setId(20L);
            return savedUser;
        });
        when(userMapper.toAdminResponse(any(User.class))).thenReturn(mappedResponse);

        UserResponse response = service.createUser(request);

        assertThat(response.getId()).isEqualTo(20L);
        assertThat(inactiveUser.getEmail())
                .startsWith("deleted-10-")
                .endsWith("@tropilot.invalid");
        verify(userRepository).saveAndFlush(inactiveUser);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void createUserRejectsEmailOwnedByActiveAccount() {
        User activeUser = user(10L, "resident@example.com", UserStatus.ACTIVE);
        AdminCreateUserRequest request = createRequest("resident@example.com");

        when(userRepository.findByEmail("resident@example.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> service.createUser(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Email is already in use");

        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUserArchivesEmailAndKeepsInactiveAccountForHistory() {
        User user = user(10L, "resident@example.com", UserStatus.ACTIVE);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        service.deleteUser(user.getId());

        assertThat(user.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(user.getEmail())
                .startsWith("deleted-10-")
                .endsWith("@tropilot.invalid");
        assertThat(user.isMustChangePassword()).isFalse();
        assertThat(user.getTemporaryPasswordEncrypted()).isNull();
        verify(userRepository).save(user);
        verify(activityLogService).recordCurrentUser(
                "USER_DELETED",
                "Deleted user account for resident@example.com"
        );
    }

    private AdminCreateUserRequest createRequest(String email) {
        AdminCreateUserRequest request = new AdminCreateUserRequest();
        request.setFullName("Resident User");
        request.setEmail(email);
        request.setPhone("0123456789");
        request.setRole(UserRole.RESIDENT_HEAD);
        return request;
    }

    private User user(Long id, String email, UserStatus status) {
        return User.builder()
                .id(id)
                .fullName("Resident User")
                .email(email)
                .phone("0123456789")
                .password("encoded-password")
                .temporaryPasswordEncrypted("encrypted-password")
                .role(UserRole.RESIDENT_HEAD)
                .status(status)
                .mustChangePassword(true)
                .build();
    }
}
