package com.tropilot.service;

import com.tropilot.dto.response.AdminDashboardResponse;
import com.tropilot.dto.response.ResidentDashboardResponse;
import com.tropilot.dto.response.StaffDashboardResponse;

/** Hợp đồng cung cấp số liệu tổng quan cho dashboard của admin, nhân viên và cư dân. */
public interface DashboardService {

    AdminDashboardResponse getAdminDashboard();

    StaffDashboardResponse getStaffDashboard(Long staffId);

    ResidentDashboardResponse getResidentDashboard(Long residentHeadId);
}
