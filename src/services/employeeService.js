import { supabase } from '../supabase/client';
import { getDepartmentsList, getPositionsList } from './organizationService';

// Get all employees with department and position details
// Inside src/services/employeeService.js

export async function getEmployees(filters = {}) {
  try {
    let query = supabase
      .from('employees')
      .select(`
        employee_id,
        employee_code,
        full_name,
        date_deployed,
        date_left,
        status,
        created_at,
        department_id,  
        position_id,    
        departments (
          department_id,
          department_name
        ),
        positions (
          position_id,
          position_name
        ),
        accounts ( account_id ) 
      `) // <-- NEW: We added 'accounts ( account_id )' to the select query
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.department_id) {
      query = query.eq('department_id', filters.department_id);
    }

    if (filters.position_id) {
      query = query.eq('position_id', filters.position_id);
    }

    if (filters.search) {
      query = query.or(
        `full_name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    // --- NEW FILTERING LOGIC ---
    // Supabase returns 'accounts' as an array if a relationship exists.
    // We filter out any employee that has an associated account record.
    const regularEmployees = data.filter(emp => !emp.accounts || emp.accounts.length === 0);

    return regularEmployees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

// Get single employee by ID
export async function getEmployeeById(employeeId) {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments (
          department_id,
          department_name
        ),
        positions (
          position_id,
          position_name
        )
      `)
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      console.error('RLS Error fetching employee:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching employee:', error);
    
    if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
      throw new Error('You do not have permission to view this employee.');
    }
    
    return null;
  }
}

// Create new employee
export async function createEmployee(employeeData) {
  try {
    // Validate required fields
    if (!employeeData.full_name || !employeeData.full_name.trim()) {
      return { success: false, error: 'Employee name is required' };
    }

    // Prepare clean data
    const cleanData = {
      employee_code: employeeData.employee_code?.trim() || null,
      full_name: employeeData.full_name.trim(),
      department_id: employeeData.department_id || null,
      position_id: employeeData.position_id || null,
      date_deployed: employeeData.date_deployed || null,
      date_left: employeeData.date_left || null,
      status: employeeData.status || 'active',
    };

    const { data, error } = await supabase
      .from('employees')
      .insert([cleanData])
      .select(`
        *,
        departments (
          department_id,
          department_name
        ),
        positions (
          position_id,
          position_name
        )
      `)
      .single();

    if (error) {
      console.error('RLS Error creating employee:', error);
      
      // Handle specific RLS errors
      if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
        return { success: false, error: 'You do not have permission to create employees.' };
      }
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.message.includes('employee_code')) {
          return { success: false, error: 'Employee code already exists. Please use a different code.' };
        }
      }
      
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message || 'Failed to create employee' };
  }
}

// Update employee
export async function updateEmployee(employeeId, employeeData) {
  try {
    const cleanData = {
      employee_code: employeeData.employee_code?.trim() || null,
      full_name: employeeData.full_name.trim(),
      department_id: employeeData.department_id || null,
      position_id: employeeData.position_id || null,
      date_deployed: employeeData.date_deployed || null,
      date_left: employeeData.date_left || null,
      status: employeeData.status || 'active',
    };

    const { data, error } = await supabase
      .from('employees')
      .update(cleanData)
      .eq('employee_id', employeeId)
      .select(`
        *,
        departments (
          department_id,
          department_name
        ),
        positions (
          position_id,
          position_name
        )
      `)
      .single();

    if (error) {
      console.error('RLS Error updating employee:', error);
      
      if (error.code === 'PGRST116' || error.message?.includes('permission denied')) {
        return { success: false, error: 'You do not have permission to update employees.' };
      }
      
      if (error.code === '23505' && error.message.includes('employee_code')) {
        return { success: false, error: 'Employee code already exists. Please use a different code.' };
      }
      
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message || 'Failed to update employee' };
  }
}

export async function deleteEmployee(employeeId) {
  try {
    // --- 1. NEW CHECK: System Account Existence ---
    const { count: accountCount, error: accountError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId);

    if (accountError) console.error('Error checking accounts:', accountError);

    if (accountCount > 0) {
      return { 
        success: false, 
        error: 'Cannot delete: This employee is linked to a System User account. Please delete their user access in User Management first.' 
      };
    }
    // ----------------------------------------------

    // 2. Existing Check: Active Device Deployments
    const { count: deploymentCount, error: countError } = await supabase
      .from('employee_devices')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .eq('status', 'in_use');

    if (countError) console.error('Error checking deployments:', countError);

    if (deploymentCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete: Employee has ${deploymentCount} active device(s). Please return devices first.` 
      };
    }

    // 3. Proceed with Delete
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('employee_id', employeeId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: error.message || 'Failed to delete employee' };
  }
}

// Get all departments (uses the new organization service)
export async function getDepartments() {
  try {
    return await getDepartmentsList();
  } catch (error) {
    console.error('Error fetching departments for dropdown:', error);
    if (error.message?.includes('permission denied')) {
      throw new Error('You do not have permission to view departments.');
    }
    return [];
  }
}

// Get all positions (uses the new organization service)
export async function getPositions() {
  try {
    return await getPositionsList();
  } catch (error) {
    console.error('Error fetching positions for dropdown:', error);
    if (error.message?.includes('permission denied')) {
      throw new Error('You do not have permission to view positions.');
    }
    return [];
  }
}

// Utility function to check current user permissions
export async function getCurrentUserRole() {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return null;

    const { data, error } = await supabase
      .from('accounts')
      .select(`
        role_id,
        roles (
          role_name
        )
      `)
      .eq('account_id', user.user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.roles?.role_name || null;
  } catch (error) {
    console.error('Error getting current user role:', error);
    return null;
  }
}