package com.tropilot.security;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import com.tropilot.service.ResidentRoomAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
/** Kiểm tra interceptor chỉ bắt buộc chủ hộ có phân phòng ACTIVE trước khi truy cập API. */
class ResidentRoomAccessInterceptorTest {

    @Mock
    private ResidentRoomAccessService residentRoomAccessService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void residentRequestRequiresActiveAssignment() {
        AuthenticatedUser resident = authenticatedUser(10L, UserRole.RESIDENT_HEAD);
        authenticate(resident);
        when(request.getMethod()).thenReturn("GET");

        ResidentRoomAccessInterceptor interceptor =
                new ResidentRoomAccessInterceptor(residentRoomAccessService);

        assertThat(interceptor.preHandle(request, response, new Object())).isTrue();
        verify(residentRoomAccessService).requireActiveAssignment(resident.getId());
    }

    @Test
    void nonResidentRequestDoesNotCheckRoomAssignment() {
        AuthenticatedUser admin = authenticatedUser(20L, UserRole.ADMIN);
        authenticate(admin);
        when(request.getMethod()).thenReturn("GET");

        ResidentRoomAccessInterceptor interceptor =
                new ResidentRoomAccessInterceptor(residentRoomAccessService);

        assertThat(interceptor.preHandle(request, response, new Object())).isTrue();
        verify(residentRoomAccessService, never()).requireActiveAssignment(admin.getId());
    }

    private AuthenticatedUser authenticatedUser(Long id, UserRole role) {
        return new AuthenticatedUser(User.builder()
                .id(id)
                .fullName(role.name())
                .email(role.name().toLowerCase() + "@test.local")
                .password("hashed")
                .role(role)
                .status(UserStatus.ACTIVE)
                .build());
    }

    private void authenticate(AuthenticatedUser user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities())
        );
    }
}
