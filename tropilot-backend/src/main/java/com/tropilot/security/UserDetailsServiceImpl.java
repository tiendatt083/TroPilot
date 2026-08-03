package com.tropilot.security;

import com.tropilot.entity.User;
import com.tropilot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
/**
 * Cách Spring Security tải tài khoản từ cơ sở dữ liệu khi xác thực bằng email.
 */
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Chuẩn hóa email rồi tìm tài khoản. Nếu có, chuyển User thành AuthenticatedUser để Spring Security sử dụng.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new AuthenticatedUser(user);
    }
}
