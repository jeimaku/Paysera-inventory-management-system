import { supabase } from '../supabase/client';

// ==================== DEVICE MAINTENANCE SERVICE ====================

// Get all maintenance records for a specific device
export async function getDeviceMaintenanceHistory(deviceType, deviceId) {
  try {
    const { data, error } = await supabase
      .from('device_maintenance')
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code),
        approved_by:employees!approved_by_employee_id(employee_id, full_name, employee_code),
        maintenance_attachments(attachment_id, file_name, file_type, description)
      `)
      .eq('device_type', deviceType.toUpperCase())
      .eq('device_id', deviceId)
      .order('date_reported', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching device maintenance history:', error);
    return [];
  }
}

// Get maintenance summary for a device (counts, totals, etc.)
export async function getDeviceMaintenanceSummary(deviceType, deviceId) {
  try {
    const { data, error } = await supabase
      .from('device_maintenance_summary')
      .select('*')
      .eq('device_type', deviceType.toUpperCase())
      .eq('device_id', deviceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      total_maintenance_count: 0,
      repair_count: 0,
      reformat_count: 0,
      upgrade_count: 0,
      last_maintenance_date: null,
      total_maintenance_cost: 0,
      avg_repair_time_days: 0
    };
  } catch (error) {
    console.error('Error fetching device maintenance summary:', error);
    return {
      total_maintenance_count: 0,
      repair_count: 0,
      reformat_count: 0,
      upgrade_count: 0,
      last_maintenance_date: null,
      total_maintenance_cost: 0,
      avg_repair_time_days: 0
    };
  }
}

// Get all maintenance records with filtering and pagination
export async function getAllMaintenanceRecords(filters = {}) {
  try {
    let query = supabase
      .from('device_maintenance')
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code),
        approved_by:employees!approved_by_employee_id(employee_id, full_name, employee_code)
      `)
      .order('date_reported', { ascending: false });

    // Apply filters
    if (filters.device_type) {
      query = query.eq('device_type', filters.device_type);
    }

    if (filters.maintenance_type) {
      query = query.eq('maintenance_type', filters.maintenance_type);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.date_from) {
      query = query.gte('date_reported', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('date_reported', filters.date_to);
    }

    if (filters.search) {
      query = query.or(
        `issue_description.ilike.%${filters.search}%,resolution_description.ilike.%${filters.search}%,technician_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Enrich with device asset IDs
    const enrichedData = await Promise.all(
      (data || []).map(async (maintenance) => {
        const tableName = maintenance.device_type === 'LAPTOP' ? 'laptops' : 
                         maintenance.device_type === 'DESKTOP' ? 'desktops' : 'monitors';
        const idField = maintenance.device_type === 'LAPTOP' ? 'laptop_id' : 
                       maintenance.device_type === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

        try {
          const { data: deviceData } = await supabase
            .from(tableName)
            .select('asset_id, brand, model, status')
            .eq(idField, maintenance.device_id)
            .single();

          if (deviceData) {
            maintenance.device_asset_id = deviceData.asset_id;
            maintenance.device_brand = deviceData.brand;
            maintenance.device_model = deviceData.model;
            maintenance.device_current_status = deviceData.status;
          }
        } catch (err) {
          console.warn('Could not fetch device info for maintenance record:', maintenance.maintenance_id);
        }

        return maintenance;
      })
    );

    return enrichedData;
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return [];
  }
}

// Create a new maintenance record
export async function createMaintenanceRecord(maintenanceData) {
  try {
    const { data, error } = await supabase
      .from('device_maintenance')
      .insert([maintenanceData])
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code),
        approved_by:employees!approved_by_employee_id(employee_id, full_name, employee_code)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return { success: false, error: error.message };
  }
}

// Update maintenance record
export async function updateMaintenanceRecord(maintenanceId, updateData) {
  try {
    const { data, error } = await supabase
      .from('device_maintenance')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('maintenance_id', maintenanceId)
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code),
        approved_by:employees!approved_by_employee_id(employee_id, full_name, employee_code)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    return { success: false, error: error.message };
  }
}

// Delete maintenance record
export async function deleteMaintenanceRecord(maintenanceId) {
  try {
    const { error } = await supabase
      .from('device_maintenance')
      .delete()
      .eq('maintenance_id', maintenanceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    return { success: false, error: error.message };
  }
}

// Get maintenance statistics for dashboard
export async function getMaintenanceStatistics() {
  try {
    // Get overall counts
    const { count: totalRecords } = await supabase
      .from('device_maintenance')
      .select('*', { count: 'exact', head: true });

    const { count: pendingRecords } = await supabase
      .from('device_maintenance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: inProgressRecords } = await supabase
      .from('device_maintenance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress');

    const { count: completedThisMonth } = await supabase
      .from('device_maintenance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('date_completed', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);

    // Get cost summary
    const { data: costSummary } = await supabase
      .from('device_maintenance')
      .select('total_cost')
      .eq('status', 'completed')
      .not('total_cost', 'is', null);

    const totalCost = costSummary?.reduce((sum, record) => sum + (record.total_cost || 0), 0) || 0;

    return {
      totalRecords: totalRecords || 0,
      pendingRecords: pendingRecords || 0,
      inProgressRecords: inProgressRecords || 0,
      completedThisMonth: completedThisMonth || 0,
      totalMaintenanceCost: totalCost
    };
  } catch (error) {
    console.error('Error fetching maintenance statistics:', error);
    return {
      totalRecords: 0,
      pendingRecords: 0,
      inProgressRecords: 0,
      completedThisMonth: 0,
      totalMaintenanceCost: 0
    };
  }
}

// Get devices that need maintenance (based on usage patterns, last maintenance, etc.)
export async function getDevicesNeedingMaintenance() {
  try {
    // This is a complex query that identifies devices that might need maintenance
    // Based on: no recent maintenance, high usage, old devices, etc.
    
    // For now, let's get devices that haven't had maintenance in 6+ months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data, error } = await supabase
      .rpc('get_devices_needing_maintenance', {
        months_threshold: 6
      });

    if (error) {
      // If the RPC doesn't exist, fall back to basic query
      console.warn('RPC not available, using fallback query');
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching devices needing maintenance:', error);
    return [];
  }
}

// Check if device is available for deployment (considering maintenance status)
export async function checkDeviceAvailabilityForDeployment(deviceType, deviceId) {
  try {
    // Check if device has any pending or in-progress maintenance
    const { data: activeMaintenance } = await supabase
      .from('device_maintenance')
      .select('maintenance_id, status, maintenance_type, expected_completion')
      .eq('device_type', deviceType.toUpperCase())
      .eq('device_id', deviceId)
      .in('status', ['pending', 'in_progress']);

    // Get device current status
    const tableName = deviceType.toLowerCase() === 'laptop' ? 'laptops' : 
                     deviceType.toLowerCase() === 'desktop' ? 'desktops' : 'monitors';
    const idField = deviceType.toLowerCase() === 'laptop' ? 'laptop_id' : 
                   deviceType.toLowerCase() === 'desktop' ? 'desktop_id' : 'monitor_id';

    const { data: deviceData } = await supabase
      .from(tableName)
      .select('status, asset_id')
      .eq(idField, deviceId)
      .single();

    return {
      isAvailableForDeployment: 
        deviceData?.status === 'available' && 
        (!activeMaintenance || activeMaintenance.length === 0),
      deviceStatus: deviceData?.status || 'unknown',
      activeMaintenance: activeMaintenance || [],
      assetId: deviceData?.asset_id
    };
  } catch (error) {
    console.error('Error checking device availability:', error);
    return {
      isAvailableForDeployment: false,
      deviceStatus: 'unknown',
      activeMaintenance: [],
      assetId: null
    };
  }
}

// Get maintenance templates for quick creation
export async function getMaintenanceTemplates(deviceType = null) {
  try {
    let query = supabase
      .from('maintenance_templates')
      .select('*')
      .order('template_name');

    if (deviceType) {
      query = query.eq('device_type', deviceType.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching maintenance templates:', error);
    return [];
  }
}