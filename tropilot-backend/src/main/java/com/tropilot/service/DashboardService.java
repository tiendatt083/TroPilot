package com.tropilot.service;

import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.StaffDashboardResponse;

public interface DashboardService {

    AdminDashboardResponse getAdminDashboard();

    StaffDashboardResponse getStaffDashboard(Long staffId);

    ResidentDashboardResponse getResidentDashboard(Long residentHeadId);
}
