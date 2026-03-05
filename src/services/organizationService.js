import { supabase } from '../supabase/client';

// ==================== DEPARTMENTS ====================

// Get all departments with employee count
export async function getDepartments(filters = {}) {
  try {
    let query = supabase
      .from('departments')
      .select(`
        department_id,
        department_name,
        employees (
          employee_id
        )
      `)
      .order('department_name');

    // Apply search filter
    if (filters.search) {
      query = query.ilike('department_name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add employee count to each department
    const departmentsWithCount = data?.map(dept => ({
      ...dept,
      employee_count: dept.employees?.length || 0,
      employees: undefined // Remove the employees array from response
    })) || [];

    return departmentsWithCount;
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

// Create new department
export async function createDepartment(departmentData) {
  try {
    const { data, error } = await supabase
      .from('departments')
      .insert([departmentData])
      .select()
      .single();

    if (error) {
      // Intercept duplicate department names
      if (error.code === '23505') {
        return { success: false, error: 'A department with this name already exists.' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating department:', error);
    return { success: false, error: error.message };
  }
}

// Update department
export async function updateDepartment(departmentId, departmentData) {
  try {
    const { data, error } = await supabase
      .from('departments')
      .update(departmentData)
      .eq('department_id', departmentId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A department with this name already exists.' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating department:', error);
    return { success: false, error: error.message };
  }
}

// Delete department
export async function deleteDepartment(departmentId) {
  try {
    // Check if department has employees
    const { count, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', departmentId);

    if (countError) throw countError;

    if (count > 0) {
      return { success: false, error: 'Cannot delete department with active employees' };
    }

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('department_id', departmentId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting department:', error);
    return { success: false, error: error.message };
  }
}

// ==================== POSITIONS ====================

// Get all positions with employee count
export async function getPositions(filters = {}) {
  try {
    let query = supabase
      .from('positions')
      .select(`
        position_id,
        position_name,
        employees (
          employee_id
        )
      `)
      .order('position_name');

    // Apply search filter
    if (filters.search) {
      query = query.ilike('position_name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add employee count to each position
    const positionsWithCount = data?.map(pos => ({
      ...pos,
      employee_count: pos.employees?.length || 0,
      employees: undefined // Remove the employees array from response
    })) || [];

    return positionsWithCount;
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

// Create new position
export async function createPosition(positionData) {
  try {
    const { data, error } = await supabase
      .from('positions')
      .insert([positionData])
      .select()
      .single();

    if (error) {
      // Intercept duplicate position titles
      if (error.code === '23505') {
        return { success: false, error: 'A position with this title already exists.' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creating position:', error);
    return { success: false, error: error.message };
  }
}

// Update position
export async function updatePosition(positionId, positionData) {
  try {
    const { data, error } = await supabase
      .from('positions')
      .update(positionData)
      .eq('position_id', positionId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A position with this title already exists.' };
      }
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating position:', error);
    return { success: false, error: error.message };
  }
}

// Delete position
export async function deletePosition(positionId) {
  try {
    // Check if position has employees
    const { count, error: countError } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('position_id', positionId);

    if (countError) throw countError;

    if (count > 0) {
      return { success: false, error: 'Cannot delete position with active employees' };
    }

    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('position_id', positionId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting position:', error);
    return { success: false, error: error.message };
  }
}

// ==================== HELPER FUNCTIONS ====================

// Get simple lists for dropdowns (used in employee forms)
export async function getDepartmentsList() {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .order('department_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching departments list:', error);
    return [];
  }
}

export async function getPositionsList() {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('position_id, position_name')
      .order('position_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching positions list:', error);
    return [];
  }
}