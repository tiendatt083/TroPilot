package com.tropilot.security;

import com.tropilot.entity.User;
import com.tropilot.enums.UserRole;
import com.tropilot.enums.UserStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
/**
 * Đại diện cho người dùng đã đăng nhập trong Spring Security.
 * Lớp này chuyển dữ liệu User của hệ thống sang UserDetails để Spring có thể xác thực và phân quyền theo role.
 */
public class AuthenticatedUser implements UserDetails {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String password;
    private final UserRole role;
    private final UserStatus status;
    private final boolean mustChangePassword;

    /** Sao chép các thông tin cần cho xác thực từ entity User vào đối tượng phiên đăng nhập. */
    public AuthenticatedUser(User user) {
        id = user.getId();
        fullName = user.getFullName();
        email = user.getEmail();
        password = user.getPassword();
        role = user.getRole();
        status = user.getStatus();
        mustChangePassword = user.isMustChangePassword();
    }

    /** Trả về quyền theo dạng ROLE_<vai trò>, là định dạng Spring Security dùng để kiểm tra hasRole. */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    /** Dùng email làm tên đăng nhập duy nhất của người dùng. */
    @Override
    public String getUsername() {
        return email;
    }

    /** Tài khoản hiện không áp dụng thời hạn hết hiệu lực riêng. */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /** Chỉ cho phép đăng nhập khi tài khoản không bị khóa. */
    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.LOCKED;
    }

    /** Mật khẩu hiện không áp dụng thời hạn hết hiệu lực riêng. */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /** Chỉ coi tài khoản ACTIVE là đang được bật để đăng nhập. */
    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
