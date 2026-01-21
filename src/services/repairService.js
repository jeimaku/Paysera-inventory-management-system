import { supabase } from '../supabase/client';

// ==================== REPAIR SERVICE FOR IT WORKFLOW ====================

// Get all repair records with enhanced filtering
export async function getAllRepairRecords(filters = {}) {
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
    if (filters.search) {
      query = query.or(
        `issue_description.ilike.%${filters.search}%,technician_name.ilike.%${filters.search}%`
      );
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.device_type) {
      query = query.eq('device_type', filters.device_type);
    }

    if (filters.warranty_status) {
      query = query.eq('warranty_status_at_repair', filters.warranty_status);
    }

    if (filters.admin_approval) {
      query = query.eq('admin_approval_status', filters.admin_approval);
    }

    if (filters.date_range) {
      const daysAgo = parseInt(filters.date_range);
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      query = query.gte('date_reported', dateThreshold.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Enrich with device asset IDs and info
    const enrichedData = await Promise.all(
      (data || []).map(async (record) => {
        try {
          const tableName = record.device_type === 'LAPTOP' ? 'laptops' : 
                           record.device_type === 'DESKTOP' ? 'desktops' : 'monitors';
          const idField = record.device_type === 'LAPTOP' ? 'laptop_id' : 
                         record.device_type === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

          const { data: deviceData, error: deviceError } = await supabase
            .from(tableName)
            .select('asset_id, brand, model, status')
            .eq(idField, record.device_id)
            .single();

          if (!deviceError && deviceData) {
            record.device_asset_id = deviceData.asset_id;
            record.device_brand = deviceData.brand;
            record.device_model = deviceData.model;
            record.device_current_status = deviceData.status;
          }
        } catch (err) {
          console.warn('Could not fetch device info for maintenance record:', record.maintenance_id);
        }
        
        return record;
      })
    );

    return enrichedData;
  } catch (error) {
    console.error('Error fetching repair records:', error);
    return [];
  }
}

// Create a new repair record with warranty check
export async function createRepairRecord(repairData) {
  try {
    const { data, error } = await supabase
          .from('device_maintenance')
          .insert([{
            device_type: repairData.device_type,
            device_id: repairData.device_id,
            maintenance_type: repairData.maintenance_type,
            issue_description: repairData.issue_description,
            priority: repairData.priority,
            estimated_completion: repairData.estimated_completion || null,
            parts_replaced: repairData.parts_replaced || [],
            labor_hours: repairData.labor_hours || 0,
            technician_name: repairData.technician_name || 'IT Staff',
            warranty_status_at_repair: repairData.warranty_status_at_repair,
            warranty_check_date: repairData.warranty_check_date,
            warranty_expires_on: repairData.warranty_expires_on,
            repair_location: repairData.repair_location,
            status: repairData.repair_location === 'warranty' ? 'warranty_sent' : 'pending',
            admin_approval_status: 'pending',
            
            // --- ADD THIS LINE ---
            date_reported: repairData.date_reported // <--- This passes the time from your modal
            // ---------------------
          }])
          .select(`
            *,
            reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code)
          `)
          .single();

        if (error) throw error;

    // Update device status to under_repair
    await updateDeviceStatus(repairData.device_type, repairData.device_id, 'under_repair');

    return { success: true, data };
  } catch (error) {
    console.error('Error creating repair record:', error);
    return { success: false, error: error.message };
  }
}

// Update an existing repair record
export async function updateRepairRecord(maintenanceId, updateData) {
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
    console.error('Error updating repair record:', error);
    return { success: false, error: error.message };
  }
}

// Check device warranty status
export async function checkDeviceWarranty(deviceType, deviceId) {
  try {
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 
                     deviceType === 'DESKTOP' ? 'desktops' : 'monitors';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 
                   deviceType === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

    const { data: device, error } = await supabase
      .from(tableName)
      .select('warranty_end, purchase_date')
      .eq(idField, deviceId)
      .single();

    if (error) throw error;

    const today = new Date();
    const warrantyEndDate = device.warranty_end ? new Date(device.warranty_end) : null;
    
    const isUnderWarranty = warrantyEndDate && warrantyEndDate >= today;
    const daysRemaining = warrantyEndDate ? 
      Math.ceil((warrantyEndDate - today) / (1000 * 60 * 60 * 24)) : 0;

    return {
      is_under_warranty: isUnderWarranty,
      warranty_end_date: device.warranty_end,
      days_remaining: Math.max(0, daysRemaining),
      purchase_date: device.purchase_date
    };
  } catch (error) {
    console.error('Error checking device warranty:', error);
    return {
      is_under_warranty: false,
      warranty_end_date: null,
      days_remaining: 0,
      purchase_date: null
    };
  }
}

// Search for available devices for repair
export async function searchAvailableDevices(deviceType, searchTerm) {
  try {
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 
                     deviceType === 'DESKTOP' ? 'desktops' : 'monitors';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 
                   deviceType === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

    let query = supabase
      .from(tableName)
      .select('*')
      .limit(10);

    // Search in asset_id, brand, model
    if (deviceType === 'DESKTOP') {
      query = query.or(
        `asset_id.ilike.%${searchTerm}%,system_manufacturer.ilike.%${searchTerm}%,system_model.ilike.%${searchTerm}%`
      );
    } else {
      query = query.or(
        `asset_id.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format data consistently
    return (data || []).map(device => ({
      device_id: device[idField],
      asset_id: device.asset_id,
      brand: device.brand || device.system_manufacturer,
      model: device.model || device.system_model,
      status: device.status
    }));
  } catch (error) {
    console.error('Error searching devices:', error);
    return [];
  }
}

// Get repair statistics for dashboard
export async function getRepairStatistics() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [
      { count: pendingRepairs },
      { count: inProgressRepairs },
      { count: awaitingApproval },
      { count: completedThisMonth }
    ] = await Promise.all([
      supabase
        .from('device_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      supabase
        .from('device_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      
      supabase
        .from('device_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('admin_approval_status', 'pending'),
      
      supabase
        .from('device_maintenance')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('date_completed', thirtyDaysAgoStr)
    ]);

    return {
      pendingRepairs: pendingRepairs || 0,
      inProgressRepairs: inProgressRepairs || 0,
      awaitingApproval: awaitingApproval || 0,
      completedThisMonth: completedThisMonth || 0
    };
  } catch (error) {
    console.error('Error fetching repair statistics:', error);
    return {
      pendingRepairs: 0,
      inProgressRepairs: 0,
      awaitingApproval: 0,
      completedThisMonth: 0
    };
  }
}

// Update device status when repair is created/completed
export async function updateDeviceStatus(deviceType, deviceId, status) {
  try {
    const tableName = deviceType === 'LAPTOP' ? 'laptops' : 
                     deviceType === 'DESKTOP' ? 'desktops' : 'monitors';
    const idField = deviceType === 'LAPTOP' ? 'laptop_id' : 
                   deviceType === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

    const { error } = await supabase
      .from(tableName)
      .update({ status })
      .eq(idField, deviceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating device status:', error);
    return { success: false, error: error.message };
  }
}

// Mark repair as complete and ready for admin approval
export async function completeRepair(maintenanceId, completionData) {
  try {
    const updateData = {
      status: 'awaiting_approval',
      date_completed: new Date().toISOString().split('T')[0],
      resolution_description: completionData.resolution_description,
      parts_replaced: completionData.parts_replaced || [],
      labor_hours: completionData.labor_hours || 0,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('device_maintenance')
      .update(updateData)
      .eq('maintenance_id', maintenanceId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error completing repair:', error);
    return { success: false, error: error.message };
  }
}

// Get repair history for a specific device
export async function getDeviceRepairHistory(deviceType, deviceId) {
  try {
    const { data, error } = await supabase
      .from('device_maintenance')
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code),
        approved_by:employees!approved_by_employee_id(employee_id, full_name, employee_code)
      `)
      .eq('device_type', deviceType.toUpperCase())
      .eq('device_id', deviceId)
      .order('date_reported', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching device repair history:', error);
    return [];
  }
}

// Get devices that need admin approval
export async function getRepairsAwaitingApproval() {
  try {
    const { data, error } = await supabase
      .from('device_maintenance')
      .select(`
        *,
        reported_by:employees!reported_by_employee_id(employee_id, full_name, employee_code)
      `)
      .eq('admin_approval_status', 'pending')
      .eq('status', 'awaiting_approval')
      .order('date_completed', { ascending: true });

    if (error) throw error;

    // Enrich with device info
    const enrichedData = await Promise.all(
      (data || []).map(async (record) => {
        const tableName = record.device_type === 'LAPTOP' ? 'laptops' : 
                         record.device_type === 'DESKTOP' ? 'desktops' : 'monitors';
        const idField = record.device_type === 'LAPTOP' ? 'laptop_id' : 
                       record.device_type === 'DESKTOP' ? 'desktop_id' : 'monitor_id';

        try {
          const { data: deviceData } = await supabase
            .from(tableName)
            .select('asset_id, brand, model, device_condition')
            .eq(idField, record.device_id)
            .single();

          if (deviceData) {
            record.device_asset_id = deviceData.asset_id;
            record.device_brand = deviceData.brand;
            record.device_model = deviceData.model;
            record.device_condition = deviceData.device_condition;
          }
        } catch (err) {
          console.warn('Could not fetch device info:', record.device_id);
        }

        return record;
      })
    );

    return enrichedData;
  } catch (error) {
    console.error('Error fetching repairs awaiting approval:', error);
    return [];
  }
}


export async function processRepairApproval(maintenanceId, decision, notes, deviceType, deviceId) {
  try {
    const isApproved = decision === 'approved';
    
    // 1. Fetch current record to check if it's a warranty case
    const { data: currentRecord, error: fetchError } = await supabase
      .from('device_maintenance')
      .select('repair_location')
      .eq('maintenance_id', maintenanceId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Logic: What happens to the device status?
    // If Approved -> 'available' (It's being fixed, so it will be available eventually)
    // If Rejected -> 'retired' (It's broken and we aren't fixing it)
    const newDeviceStatus = isApproved ? 'available' : 'retired'; 

    // 3. Prepare Maintenance Updates
    const updates = {
      admin_approval_status: decision,
      admin_approval_date: new Date().toISOString(),
      admin_approval_notes: notes,
      can_redeploy: isApproved
    };

    // --- SMART STATUS AUTOMATION ---
    if (decision === 'rejected') {
      updates.status = 'cancelled';
    } else if (isApproved && currentRecord.repair_location === 'warranty') {
      // If Admin approves a Warranty claim, AUTO-UPDATE status to 'warranty_sent'
      updates.status = 'warranty_sent'; 
    }
    // -------------------------------

    const { error: maintenanceError } = await supabase
      .from('device_maintenance')
      .update(updates)
      .eq('maintenance_id', maintenanceId);

    if (maintenanceError) throw maintenanceError;

    // 4. Update the Device Inventory Status
    let tableName = '';
    let idColumn = '';
    
    switch (deviceType?.toUpperCase()) {
      case 'LAPTOP': tableName = 'laptops'; idColumn = 'laptop_id'; break;
      case 'DESKTOP': tableName = 'desktops'; idColumn = 'desktop_id'; break;
      case 'MONITOR': tableName = 'monitors'; idColumn = 'monitor_id'; break;
      default: throw new Error('Unknown device type');
    }

    const { error: deviceError } = await supabase
      .from(tableName)
      .update({ status: newDeviceStatus })
      .eq(idColumn, deviceId);

    if (deviceError) throw deviceError;

    return { success: true };
  } catch (error) {
    console.error('Error processing approval:', error);
    return { success: false, error: error.message };
  }
}

export async function overrideWarrantyStatus(maintenanceId, newStatus) {
  try {
    const { error } = await supabase
      .from('device_maintenance')
      .update({ 
        warranty_status_at_repair: newStatus,
        repair_location: newStatus === 'active' ? 'warranty' : 'internal'
      })
      .eq('maintenance_id', maintenanceId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error overriding warranty:', error);
    return { success: false, error: error.message };
  }
}