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

// UPDATE THIS FUNCTION
export async function toggleUserStatus(accountId, currentStatus) {
  try {
    // We want to FLIP the status (True -> False, False -> True)
    const newStatus = !currentStatus;

    const { error } = await supabase.rpc('toggle_user_status_secure', {
      target_account_id: accountId,
      new_status: newStatus
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error toggling user status:', error);
    return { success: false, error: error.message };
  }
}

// --- ADD THIS NEW FUNCTION ---
export async function deleteUser(accountId) {
  try {
    const { error } = await supabase.rpc('delete_system_user', { 
      target_user_id: accountId 
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
}

// --- ADD HELPER FOR PASSWORD VERIFICATION ---
export async function verifyAdminPassword(password) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) throw new Error('No active session');

    // Attempt to sign in with the current email and the provided password
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (error) return false;
    return true;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

// Add this to your userService.js
export async function changeUserPassword(accountId, newPassword) {
  try {
    // Note: If you are using Supabase's built-in Auth, you need an RPC or Edge Function to change another user's password.
    // If you are storing a custom password_hash in your 'accounts' table, it looks like this:
    const { error } = await supabase
      .from('accounts')
      .update({ password_hash: newPassword }) // Ensure you hash this in production!
      .eq('account_id', accountId);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    return { success: false, error: error.message };
  }
}