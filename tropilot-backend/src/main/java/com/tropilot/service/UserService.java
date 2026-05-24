package com.tropilot.service;

import com.tropilot.dto.request.AdminCreateUserRequest;
import com.tropilot.dto.request.AdminUpdateUserRequest;
import com.tropilot.dto.response.PasswordResetResponse;
import com.tropilot.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse createUser(AdminCreateUserRequest request);

    List<UserResponse> getUsers();

    UserResponse getUser(Long id);

    UserResponse updateUser(Long id, AdminUpdateUserRequest request);

    UserResponse lockUser(Long id);

    UserResponse unlockUser(Long id);

    PasswordResetResponse resetPassword(Long id);

    void deleteUser(Long id);
}
