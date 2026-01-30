import { supabase } from '../supabase/client';

// Enhanced dashboard service for both Admin and IT dashboards
export class DashboardService {
  
  // Get comprehensive admin dashboard stats
  static async getAdminDashboardStats() {
    try {
      const [employeeStats, deviceStats, maintenanceStats, deploymentStats] = await Promise.all([
        this.getEmployeeStats(),
        this.getDeviceInventoryStats(),
        this.getMaintenanceOverview(),
        this.getDeploymentOverview()
      ]);

      return {
        employees: employeeStats,
        devices: deviceStats,
        maintenance: maintenanceStats,
        deployments: deploymentStats
      };
    } catch (error) {
      console.error('Error fetching admin dashboard stats:', error);
      throw error;
    }
  }

  // Get IT-focused dashboard stats
  static async getITDashboardStats() {
    try {
      const [operationalStats, deviceAvailability, maintenanceAlerts, recentActivity] = await Promise.all([
        this.getOperationalStats(),
        this.getDeviceAvailability(),
        this.getMaintenanceAlerts(),
        this.getRecentDeploymentActivity()
      ]);

      return {
        operational: operationalStats,
        availability: deviceAvailability,
        alerts: maintenanceAlerts,
        activity: recentActivity
      };
    } catch (error) {
      console.error('Error fetching IT dashboard stats:', error);
      throw error;
    }
  }

  // Employee statistics
  static async getEmployeeStats() {
    try {
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get department breakdown
      const { data: departmentBreakdown } = await supabase
        .from('employees')
        .select(`
          departments (
            department_name
          )
        `)
        .eq('status', 'active');

      const departmentCounts = departmentBreakdown?.reduce((acc, emp) => {
        const dept = emp.departments?.department_name || 'No Department';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}) || {};

      return {
        total: totalEmployees || 0,
        active: activeEmployees || 0,
        inactive: (totalEmployees || 0) - (activeEmployees || 0),
        departmentBreakdown: departmentCounts
      };
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      return { total: 0, active: 0, inactive: 0, departmentBreakdown: {} };
    }
  }

  // Device inventory statistics
  static async getDeviceInventoryStats() {
    try {
      const [laptopData, desktopData, monitorData] = await Promise.all([
        supabase.from('laptops').select('status, device_condition'),
        supabase.from('desktops').select('status, device_condition'),
        supabase.from('monitors').select('status, device_condition')
      ]);

      const processDeviceData = (data, type) => {
        const devices = data.data || [];
        return {
          total: devices.length,
          available: devices.filter(d => d.status === 'available').length,
          issued: devices.filter(d => d.status === 'issued').length,
          maintenance: devices.filter(d => d.status === 'maintenance').length,
          brandNew: devices.filter(d => d.device_condition === 'brand_new').length,
          secondHand: devices.filter(d => d.device_condition === 'second_hand').length,
          utilization: devices.length > 0 ? 
            Math.round((devices.filter(d => d.status === 'issued').length / devices.length) * 100) : 0
        };
      };

      return {
        laptops: processDeviceData(laptopData, 'laptop'),
        desktops: processDeviceData(desktopData, 'desktop'),
        monitors: processDeviceData(monitorData, 'monitor')
      };
    } catch (error) {
      console.error('Error fetching device inventory stats:', error);
      return {
        laptops: { total: 0, available: 0, issued: 0, maintenance: 0, utilization: 0 },
        desktops: { total: 0, available: 0, issued: 0, maintenance: 0, utilization: 0 },
        monitors: { total: 0, available: 0, issued: 0, maintenance: 0, utilization: 0 }
      };
    }
  }

  // Maintenance overview
  static async getMaintenanceOverview() {
    try {
      const { data: maintenanceData } = await supabase
        .from('device_maintenance')
        .select('status, maintenance_type, total_cost, priority, date_reported');

      if (!maintenanceData) return this.getEmptyMaintenanceStats();

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeek = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

      const stats = {
        total: maintenanceData.length,
        pending: maintenanceData.filter(m => m.status === 'pending').length,
        inProgress: maintenanceData.filter(m => m.status === 'in_progress').length,
        completed: maintenanceData.filter(m => m.status === 'completed').length,
        thisMonth: maintenanceData.filter(m => 
          new Date(m.date_reported) >= thisMonth
        ).length,
        thisWeek: maintenanceData.filter(m => 
          new Date(m.date_reported) >= thisWeek
        ).length,
        totalCost: maintenanceData.reduce((sum, m) => sum + (m.total_cost || 0), 0),
        highPriority: maintenanceData.filter(m => 
          m.priority === 'high' || m.priority === 'urgent'
        ).length,
        typeBreakdown: maintenanceData.reduce((acc, m) => {
          acc[m.maintenance_type] = (acc[m.maintenance_type] || 0) + 1;
          return acc;
        }, {}),
        statusBreakdown: maintenanceData.reduce((acc, m) => {
          acc[m.status] = (acc[m.status] || 0) + 1;
          return acc;
        }, {})
      };

      return stats;
    } catch (error) {
      console.error('Error fetching maintenance overview:', error);
      return this.getEmptyMaintenanceStats();
    }
  }

  // Deployment overview
  static async getDeploymentOverview() {
    try {
      const { data: deploymentData } = await supabase
        .from('employee_devices')
        .select(`
          *,
          employees (
            departments (
              department_name
            )
          )
        `);

      if (!deploymentData) return { total: 0, active: 0, returned: 0 };

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: deploymentData.length,
        active: deploymentData.filter(d => d.status === 'in_use').length,
        returned: deploymentData.filter(d => d.status === 'returned').length,
        thisMonth: deploymentData.filter(d => 
          new Date(d.date_issued) >= thisMonth
        ).length,
        laptopsDeployed: deploymentData.filter(d => 
          d.device_type === 'LAPTOP' && d.status === 'in_use'
        ).length,
        desktopsDeployed: deploymentData.filter(d => 
          d.device_type === 'DESKTOP' && d.status === 'in_use'
        ).length,
        departmentBreakdown: deploymentData
          .filter(d => d.status === 'in_use')
          .reduce((acc, d) => {
            const dept = d.employees?.departments?.department_name || 'No Department';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
          }, {})
      };
    } catch (error) {
      console.error('Error fetching deployment overview:', error);
      return { total: 0, active: 0, returned: 0 };
    }
  }

  // IT-specific operational stats
  static async getOperationalStats() {
    try {
      const [deploymentData, maintenanceData] = await Promise.all([
        supabase.from('employee_devices').select('status, date_issued, device_type'),
        supabase.from('device_maintenance').select('status, priority, date_reported')
      ]);

      const deployments = deploymentData.data || [];
      const maintenance = maintenanceData.data || [];

      const today = new Date().toISOString().split('T')[0];
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return {
        activeDeployments: deployments.filter(d => d.status === 'in_use').length,
        deploymentsToday: deployments.filter(d => 
          d.date_issued === today
        ).length,
        deploymentsThisWeek: deployments.filter(d => 
          d.date_issued >= thisWeek
        ).length,
        pendingMaintenance: maintenance.filter(m => m.status === 'pending').length,
        urgentMaintenance: maintenance.filter(m => 
          m.priority === 'urgent' && m.status !== 'completed'
        ).length,
        maintenanceBacklog: maintenance.filter(m => 
          ['pending', 'in_progress'].includes(m.status)
        ).length
      };
    } catch (error) {
      console.error('Error fetching operational stats:', error);
      return {
        activeDeployments: 0,
        deploymentsToday: 0,
        deploymentsThisWeek: 0,
        pendingMaintenance: 0,
        urgentMaintenance: 0,
        maintenanceBacklog: 0
      };
    }
  }

  // Device availability for IT dashboard
  static async getDeviceAvailability() {
    try {
      const [laptops, desktops, monitors] = await Promise.all([
        supabase.from('laptops').select('status').eq('status', 'available'),
        supabase.from('desktops').select('status').eq('status', 'available'),
        supabase.from('monitors').select('status').eq('status', 'available')
      ]);

      return {
        laptops: laptops.count || 0,
        desktops: desktops.count || 0,
        monitors: monitors.count || 0,
        total: (laptops.count || 0) + (desktops.count || 0) + (monitors.count || 0)
      };
    } catch (error) {
      console.error('Error fetching device availability:', error);
      return { laptops: 0, desktops: 0, monitors: 0, total: 0 };
    }
  }

  // Maintenance alerts for IT dashboard
  static async getMaintenanceAlerts() {
    try {
      const { data: urgentMaintenance } = await supabase
        .from('device_maintenance')
        .select(`
          maintenance_id,
          device_type,
          device_id,
          maintenance_type,
          issue_description,
          priority,
          date_reported
        `)
        .in('priority', ['high', 'urgent'])
        .in('status', ['pending', 'in_progress'])
        .order('date_reported', { ascending: true })
        .limit(5);

      const alerts = [];

      if (urgentMaintenance && urgentMaintenance.length > 0) {
        urgentMaintenance.forEach(maintenance => {
          alerts.push({
            type: maintenance.priority === 'urgent' ? 'critical' : 'warning',
            title: `${maintenance.device_type} Maintenance`,
            message: maintenance.issue_description || 'Device needs attention',
            deviceType: maintenance.device_type,
            deviceId: maintenance.device_id,
            priority: maintenance.priority,
            dateReported: maintenance.date_reported,
            action: 'View Details',
            link: `/it/repairs`
          });
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error fetching maintenance alerts:', error);
      return [];
    }
  }

  // Recent deployment activity for IT dashboard
  static async getRecentDeploymentActivity() {
    try {
      const { data: recentDeployments } = await supabase
        .from('employee_devices')
        .select(`
          employee_device_id,
          device_type,
          device_id,
          date_issued,
          status,
          employees (
            full_name,
            departments (
              department_name
            )
          ),
          employee_monitors (
            monitor_id,
            monitors (
              asset_id,
              brand,
              model
            )
          )
        `)
        .order('date_issued', { ascending: false })
        .limit(10);

      return recentDeployments || [];
    } catch (error) {
      console.error('Error fetching recent deployment activity:', error);
      return [];
    }
  }

  // Helper method for empty maintenance stats
  static getEmptyMaintenanceStats() {
    return {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      thisMonth: 0,
      thisWeek: 0,
      totalCost: 0,
      highPriority: 0,
      typeBreakdown: {},
      statusBreakdown: {}
    };
  }

  // Get system health indicators
  static async getSystemHealth() {
    try {
      const [dbConnection, lastSyncTime] = await Promise.all([
        this.checkDatabaseConnection(),
        this.getLastSyncTime()
      ]);

      return {
        database: dbConnection,
        lastSync: lastSyncTime,
        status: dbConnection ? 'healthy' : 'degraded'
      };
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        database: false,
        lastSync: null,
        status: 'unknown'
      };
    }
  }

  // Check database connection
  static async checkDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('employees').select('employee_id').limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  // Get last sync time (placeholder - could be from a sync log table)
  static async getLastSyncTime() {
    // This would typically come from a sync log or similar table
    // For now, return current time as placeholder
    return new Date().toISOString();
  }

  // Get dashboard refresh interval based on role
  static getDashboardRefreshInterval(role) {
    const intervals = {
      'ADMIN': 5 * 60 * 1000, // 5 minutes
      'IT': 2 * 60 * 1000,    // 2 minutes
      'EMPLOYEE': 10 * 60 * 1000 // 10 minutes
    };
    
    return intervals[role] || intervals['EMPLOYEE'];
  }

  // Format numbers for display
  static formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }

  // Format currency for display
  static formatCurrency(amount) {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format percentage for display
  static formatPercentage(value, total) {
    if (!total || total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  }
}

export default DashboardService;