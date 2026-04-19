import { supabase } from '../supabase/client';

// ==================== RETURNED DEVICES SERVICE ====================

// Get all returned devices with comprehensive data
export async function getReturnedDevices() {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        date_returned,
        status,
        return_reason, 
        created_at,
        employees (
          employee_id,
          employee_code,
          full_name,
          departments (
            department_name
          ),
          positions (
            position_name
          )
        ),
        employee_monitors (
          monitor_id,
          monitors (
            asset_id,
            brand,
            model,
            model_code,
            serial_number,
            status
          )
        )
      `)
      .eq('status', 'returned')
      .order('date_returned', { ascending: false });

    if (error) throw error;

// ENRICHMENT STEP: Fetch Asset ID for every device type
    const enrichedData = await Promise.all(
      (data || []).map(async (record) => {
        try {
          let tableName = '';
          let idField = '';

          // Properly route all 3 device types
          if (record.device_type === 'LAPTOP') {
            tableName = 'laptops';
            idField = 'laptop_id';
          } else if (record.device_type === 'DESKTOP') {
            tableName = 'desktops';
            idField = 'desktop_id';
          } else if (record.device_type === 'MONITOR') {
            tableName = 'monitors';
            idField = 'monitor_id';
          }

          // Fetch the Asset ID if we have a valid table
          if (tableName && idField) {
            const { data: deviceData, error: deviceError } = await supabase
              .from(tableName)
              .select('asset_id')
              .eq(idField, record.device_id)
              .single();

            if (!deviceError && deviceData) {
              record.device_asset_id = deviceData.asset_id;
            }
          }
        } catch (err) {
          console.warn('Could not fetch asset_id for device:', record.device_id);
        }
        
        return record;
      })
    );

    return enrichedData;  
  } catch (error) {
    console.error('Error fetching returned devices:', error);
    return [];
  }
}

// Get returned devices statistics
export async function getReturnedDevicesStats() {
  try {
    const devices = await getReturnedDevices();
    
    const stats = {
      totalReturned: devices.length,
      totalLaptops: devices.filter(d => d.device_type === 'LAPTOP').length,
      totalDesktops: devices.filter(d => d.device_type === 'DESKTOP').length,
      returnedThisMonth: devices.filter(d => {
        if (!d.date_returned) return false;
        const returnDate = new Date(d.date_returned);
        const now = new Date();
        return returnDate.getMonth() === now.getMonth() && 
               returnDate.getFullYear() === now.getFullYear();
      }).length,
      returnedThisWeek: devices.filter(d => {
        if (!d.date_returned) return false;
        const returnDate = new Date(d.date_returned);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        return returnDate >= weekAgo;
      }).length,
      averageUsageDays: devices.length > 0 ? Math.round(
        devices.reduce((sum, d) => {
          if (!d.date_issued || !d.date_returned) return sum;
          const start = new Date(d.date_issued);
          const end = new Date(d.date_returned);
          return sum + Math.floor((end - start) / (1000 * 60 * 60 * 24));
        }, 0) / devices.length
      ) : 0,
      devicesByDepartment: devices.reduce((acc, device) => {
        const dept = device.employees?.departments?.department_name || 'No Department';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
      devicesByMonth: devices.reduce((acc, device) => {
        if (!device.date_returned) return acc;
        const month = new Date(device.date_returned).toISOString().slice(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {})
    };

    return stats;
  } catch (error) {
    console.error('Error calculating returned devices stats:', error);
    return {
      totalReturned: 0,
      totalLaptops: 0,
      totalDesktops: 0,
      returnedThisMonth: 0,
      returnedThisWeek: 0,
      averageUsageDays: 0,
      devicesByDepartment: {},
      devicesByMonth: {}
    };
  }
}

// Get devices returned in a specific date range
export async function getReturnedDevicesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        date_returned,
        status,
        employees (
          employee_code,
          full_name,
          departments (
            department_name
          )
        )
      `)
      .eq('status', 'returned')
      .gte('date_returned', startDate)
      .lte('date_returned', endDate)
      .order('date_returned', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching returned devices by date range:', error);
    return [];
  }
}

// Get returned devices by specific department
export async function getReturnedDevicesByDepartment(departmentName) {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        date_returned,
        status,
        employees!inner (
          employee_code,
          full_name,
          departments!inner (
            department_name
          )
        )
      `)
      .eq('status', 'returned')
      .eq('employees.departments.department_name', departmentName)
      .order('date_returned', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching returned devices by department:', error);
    return [];
  }
}

// Mark a returned device as ready for reassignment (update device status)
export async function markDeviceReadyForReassignment(employeeDeviceId, deviceType, deviceId) {
  try {
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 'desktops';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
    
    // Update device status to 'available'
    const { error: deviceUpdateError } = await supabase
      .from(tableName)
      .update({ status: 'available' })
      .eq(idField, deviceId);

    if (deviceUpdateError) throw deviceUpdateError;

    // Optionally add a note or timestamp for when it was marked ready
    const { error: deploymentUpdateError } = await supabase
      .from('employee_devices')
      .update({ 
        updated_at: new Date().toISOString(),
        // Could add a 'ready_for_reassignment' timestamp field
      })
      .eq('employee_device_id', employeeDeviceId);

    if (deploymentUpdateError) throw deploymentUpdateError;

    return { success: true };
  } catch (error) {
    console.error('Error marking device ready for reassignment:', error);
    return { success: false, error: error.message };
  }
}

// Get device details for a specific returned device (for the modal)
export async function getReturnedDeviceDetails(employeeDeviceId) {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        date_returned,
        status,
        employees (
          employee_id,
          employee_code,
          full_name,
          departments (
            department_name
          ),
          positions (
            position_name
          )
        ),
        employee_monitors (
          monitor_id,
          monitors (
            asset_id,
            brand,
            model,
            model_code,
            serial_number
          )
        )
      `)
      .eq('employee_device_id', employeeDeviceId)
      .eq('status', 'returned')
      .single();

    if (error) throw error;
    
    // Get device specifications
    const tableName = data.device_type === 'LAPTOP' ? 'laptops' : 'desktops';
    const idField = data.device_type === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
    
    let deviceSpecs = null;
    if (data.device_type === 'LAPTOP') {
      const { data: specs, error: specsError } = await supabase
        .from('laptops')
        .select('*')
        .eq('laptop_id', data.device_id)
        .single();
      
      if (!specsError) deviceSpecs = specs;
    } else {
      const { data: specs, error: specsError } = await supabase
        .from('desktops')
        .select(`
          *,
          desktop_memory (
            memory_id,
            slot_number,
            size_gb
          ),
          desktop_storage (
            storage_id,
            storage_type,
            capacity_gb
          )
        `)
        .eq('desktop_id', data.device_id)
        .single();
      
      if (!specsError) {
        deviceSpecs = {
          ...specs,
          memory_modules: specs.desktop_memory || [],
          storage_devices: specs.desktop_storage || []
        };
      }
    }

    return {
      deployment: data,
      specifications: deviceSpecs
    };
  } catch (error) {
    console.error('Error fetching returned device details:', error);
    return null;
  }
}