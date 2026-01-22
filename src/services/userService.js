import { supabase } from '../supabase/client';

// Get all system users (accounts)
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from('accounts')
      .select(`
        account_id,
        email,
        is_active,
        created_at,
        role_id,
        roles ( role_id, role_name ),
        employee_id,
        employees ( 
          employee_id, 
          full_name, 
          employee_code,
          departments ( department_name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Get all roles for the dropdown
export async function getRoles() {
  const { data } = await supabase.from('roles').select('*');
  return data || [];
}

// Create a new user (Calls the SQL Function we made)
export async function createUser(userData) {
  try {
    const { email, password, employee_id, role_id } = userData;

    // Call the Postgres function 'create_new_user'
    const { data, error } = await supabase.rpc('create_new_user', {
      email,
      password,
      employee_id,
      role_id
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
}

// Deactivate/Activate User
export async function toggleUserStatus(accountId, currentStatus) {
  try {
    const { error } = await supabase
      .from('accounts')
      .update({ is_active: !currentStatus })
      .eq('account_id', accountId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}