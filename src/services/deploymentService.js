import { supabase } from '../supabase/client';

// ==================== DEPLOYMENT MANAGEMENT ====================

// Get all employees (for IT to see who can receive devices)
export async function getEmployeesForDeployment() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        employee_id,
        employee_code,
        full_name,
        departments (
          department_name
        ),
        positions (
          position_name
        ),
        status
      `)
      .eq('status', 'active')
      .order('full_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

// Get available devices for deployment (not currently issued)
export async function getAvailableDevices(deviceType) {
  try {
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 'desktops';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
    
    console.log(`🔍 Fetching ${deviceType} devices from table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('status', 'available')
      .order('asset_id');

    if (error) {
      console.error(`❌ Error fetching ${deviceType} devices:`, error);
      throw error;
    }
    
    // Format data consistently
    const formattedDevices = data?.map(device => {
      // Determine the display label based on device type
      const displayLabel = deviceType === 'LAPTOP' 
        ? `${device.brand || 'Unknown'} ${device.model || 'Unknown'}`
        : `${device.operating_system || 'No OS'} (${device.processor || 'Unknown CPU'})`;

      const formatted = {
        ...device,
        device_id: device[idField],
        device_type: deviceType,
        display_name: `${device.asset_id} - ${displayLabel}`
      };
      
      return formatted;
    }) || [];
    
    return formattedDevices;
  } catch (error) {
    console.error(`❌ Error in getAvailableDevices for ${deviceType}:`, error);
    return [];
  }
}

// Deploy device to employee (UPDATED: Snapshots owner name)
export async function deployDevice(deploymentData) {
  try {
    const { employeeId, deviceType, deviceId, monitorIds = [] } = deploymentData;

    // STEP 1: Fetch the employee's name to snapshot it
    // This ensures we have the name saved even if the user is deleted later.
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('full_name')
      .eq('employee_id', employeeId)
      .single();

    if (empError) throw new Error('Employee not found for deployment');
    
    // STEP 2: Create employee_device record WITH the snapshot name
    const { data: employeeDevice, error: deployError } = await supabase
      .from('employee_devices')
      .insert({
        employee_id: employeeId,
        device_type: deviceType,
        device_id: deviceId,
        date_issued: new Date().toISOString().split('T')[0],
        status: 'in_use',
        archived_owner_name: employee.full_name // <--- Saves name permanently
      })
      .select()
      .single();

    if (deployError) throw deployError;

    // STEP 3: Update device status to 'issued'
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 'desktops';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
    
    const { error: deviceUpdateError } = await supabase
      .from(tableName)
      .update({ status: 'issued' })
      .eq(idField, deviceId);

    if (deviceUpdateError) throw deviceUpdateError;

    // STEP 4: Assign monitors if provided
    if (monitorIds.length > 0) {
      const monitorAssignments = monitorIds.map(monitorId => ({
        employee_device_id: employeeDevice.employee_device_id,
        monitor_id: monitorId
      }));

      const { error: monitorError } = await supabase
        .from('employee_monitors')
        .insert(monitorAssignments);

      if (monitorError) throw monitorError;

      // Update monitor status to 'issued'
      const { error: monitorUpdateError } = await supabase
        .from('monitors')
        .update({ status: 'issued' })
        .in('monitor_id', monitorIds);

      if (monitorUpdateError) throw monitorUpdateError;
    }

    return { success: true, data: employeeDevice };
  } catch (error) {
    console.error('Error deploying device:', error);
    return { success: false, error: error.message };
  }
}

// Get all current deployments
export async function getCurrentDeployments() {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        status,
        employees (
          employee_id,
          employee_code,
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
      .eq('status', 'in_use')
      .order('date_issued', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching current deployments:', error);
    return [];
  }
}

// ==================== DEPLOYMENT HISTORY ====================

// Get complete deployment history with filters
export async function getDeploymentHistory(filters = {}) {
  try {
    let query = supabase
      .from('employee_devices')
      .select(`
        employee_device_id,
        device_type,
        device_id,
        date_issued,
        date_returned,
        return_reason, 
        status,
        created_at,
        archived_owner_name,
        employees (
          employee_id,
          employee_code,
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
            model,
            model_code,
            serial_number
          )
        )
      `)
      .order('date_issued', { ascending: false });

    // Apply filters
    if (filters.search) {
      query = query.or(
        `employees.full_name.ilike.%${filters.search}%,employees.employee_code.ilike.%${filters.search}%`
      );
    }

    if (filters.deviceType) {
      query = query.eq('device_type', filters.deviceType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateRange) {
      const daysAgo = parseInt(filters.dateRange);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      query = query.gte('date_issued', dateThreshold.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add device asset_id for better display
    const enrichedData = await Promise.all(
      (data || []).map(async (deployment) => {
        try {
          const tableName = deployment.device_type === 'LAPTOP' ? 'laptops' : 'desktops';
          const idField = deployment.device_type === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
          
          const { data: deviceData, error: deviceError } = await supabase
            .from(tableName)
            .select('asset_id')
            .eq(idField, deployment.device_id)
            .single();

          if (!deviceError && deviceData) {
            deployment.device_asset_id = deviceData.asset_id;
          }
        } catch (err) {
          console.warn('Could not fetch asset_id for device:', deployment.device_id);
        }
        
        return deployment;
      })
    );

    return enrichedData;
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    return [];
  }
}

// ==================== DEVICE SPECIFICATIONS ====================

// Get detailed device specifications for modal
export async function getDetailedDeviceSpecs(deviceType, deviceId) {
  try {
    if (deviceType === 'LAPTOP') {
      const { data, error } = await supabase
        .from('laptops')
        .select('*')
        .eq('laptop_id', deviceId)
        .single();

      if (error) throw error;
      return data;
    } else if (deviceType === 'DESKTOP') {
      // Get desktop with memory modules and storage devices
      const { data, error } = await supabase
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
        .eq('desktop_id', deviceId)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        memory_modules: data.desktop_memory || [],
        storage_devices: data.desktop_storage || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching device specifications:', error);
    return null;
  }
}

// Return Device
export async function returnDevice(employeeDeviceId, reason = '') {
  try {
    // Step 1: Get the deployment details to know what devices to free up
    const { data: deployment, error: fetchError } = await supabase
      .from('employee_devices')
      .select(`
        *,
        employee_monitors (
          monitor_id
        )
      `)
      .eq('employee_device_id', employeeDeviceId)
      .single();
    
    if (fetchError) throw fetchError;

    // Step 2: Update status to returned AND save the reason
    const { error: updateError } = await supabase
      .from('employee_devices')
      .update({ 
        status: 'returned', 
        date_returned: new Date().toISOString(),
        return_reason: reason 
      })
      .eq('employee_device_id', employeeDeviceId);

    if (updateError) throw updateError;

    // Step 3: Update main device status to 'available'
    const tableName = deployment.device_type === 'LAPTOP' ? 'laptops' : 'desktops';
    const idField = deployment.device_type === 'LAPTOP' ? 'laptop_id' : 'desktop_id';
    
    const { error: deviceUpdateError } = await supabase
      .from(tableName)
      .update({ status: 'available' })
      .eq(idField, deployment.device_id);

    if (deviceUpdateError) throw deviceUpdateError;

    // Step 4: Return monitors if any
    if (deployment.employee_monitors?.length > 0) {
      const monitorIds = deployment.employee_monitors.map(m => m.monitor_id);
      
      const { error: monitorUpdateError } = await supabase
        .from('monitors')
        .update({ status: 'available' })
        .in('monitor_id', monitorIds);

      if (monitorUpdateError) throw monitorUpdateError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error returning device:', error);
    return { success: false, error: error.message };
  }
}

export async function getAvailableMonitors() {
  try {
    const { data, error } = await supabase
      .from('monitors')
      .select('*') 
      .eq('status', 'available')
      .order('asset_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching available monitors:', error);
    return [];
  }
}


// NEW: Fetch usage history for a specific device (UPDATED WITH archived_owner_name)
export async function getDeviceUsageHistory(deviceType, deviceId) {
  try {
    const { data, error } = await supabase
      .from('employee_devices')
      .select(`
        *,
        archived_owner_name,
        employees (
          full_name,
          employee_code,
          departments ( department_name )
        )
      `)
      .eq('device_type', deviceType)
      .eq('device_id', deviceId)
      .order('date_issued', { ascending: false }); // Show newest first

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching device history:', error);
    return [];
  }
}