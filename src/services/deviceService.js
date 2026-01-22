import { supabase } from '../supabase/client';

// ==================== LAPTOPS ====================

export async function getLaptops(filters = {}) {
  try {
    let query = supabase
      .from('laptops')
      .select(`
        *,
        laptop_ram ( ram_id, slot_number, size_gb ),
        laptop_storage ( storage_id, storage_type, capacity_gb )
      `)
      .order('created_at', { ascending: false });

    // ... (Keep existing filter logic for status, brand, etc.) ...

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching laptops:', error);
    return [];
  }
}

export async function createLaptop(laptopData) {
  try {
    // 1. Separate main data from the arrays
    const { ram_modules, storage_drives, ...mainData } = laptopData;

    // 2. Sanitize main data
    const sanitizedData = {};
    Object.keys(mainData).forEach(key => {
      sanitizedData[key] = (mainData[key] === '' || mainData[key] === undefined) ? null : mainData[key];
    });

    // 3. Insert Laptop
    const { data: laptop, error: laptopError } = await supabase
      .from('laptops')
      .insert([sanitizedData])
      .select()
      .single();

    if (laptopError) throw laptopError;

    // 4. Insert RAM Modules (if any)
    if (ram_modules && ram_modules.length > 0) {
      const ramData = ram_modules.map(r => ({
        laptop_id: laptop.laptop_id,
        slot_number: r.slot_number,
        size_gb: r.size_gb
      }));
      await supabase.from('laptop_ram').insert(ramData);
    }

    // 5. Insert Storage Drives (if any)
    if (storage_drives && storage_drives.length > 0) {
      const storageData = storage_drives.map(s => ({
        laptop_id: laptop.laptop_id,
        storage_type: s.storage_type,
        capacity_gb: s.capacity_gb
      }));
      await supabase.from('laptop_storage').insert(storageData);
    }

    return { success: true, data: laptop };
  } catch (error) {
    console.error('Error creating laptop:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLaptop(laptopId, laptopData) {
  try {
    // 1. Separate Arrays from Main Data
    // Ensure 'storage_type' is NOT in mainData (it should be gone from Modal now)
    const { ram_modules, storage_drives, ...mainData } = laptopData;

    // 2. Sanitize Main Data (Convert "" to null)
    const sanitizedData = {};
    Object.keys(mainData).forEach(key => {
      sanitizedData[key] = (mainData[key] === '' || mainData[key] === undefined) ? null : mainData[key];
    });

    // 3. Update Main Table
    const { data, error } = await supabase
      .from('laptops')
      .update(sanitizedData) // Use sanitized data
      .eq('laptop_id', laptopId)
      .select()
      .single();

    if (error) throw error;

    // 4. Update RAM (Delete Old -> Insert New)
    await supabase.from('laptop_ram').delete().eq('laptop_id', laptopId);
    if (ram_modules && ram_modules.length > 0) {
      const ramData = ram_modules.map(r => ({
        laptop_id: laptopId,
        slot_number: r.slot_number || 'Slot 1', // Default if empty
        size_gb: r.size_gb || 0
      }));
      await supabase.from('laptop_ram').insert(ramData);
    }

    // 5. Update Storage (Delete Old -> Insert New)
    await supabase.from('laptop_storage').delete().eq('laptop_id', laptopId);
    if (storage_drives && storage_drives.length > 0) {
      const storageData = storage_drives.map(s => ({
        laptop_id: laptopId,
        storage_type: s.storage_type || 'SSD NVMe', // Default if empty
        capacity_gb: s.capacity_gb || 0
      }));
      await supabase.from('laptop_storage').insert(storageData);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating laptop:', error);
    return { success: false, error: error.message };
  }
}
export async function deleteLaptop(laptopId) {
  try {
    const { error } = await supabase
      .from('laptops')
      .delete()
      .eq('laptop_id', laptopId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting laptop:', error);
    return { success: false, error: error.message };
  }
}

// ==================== DESKTOPS ====================

export async function getDesktops(filters = {}) {
  try {
    let query = supabase
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
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // --- ADD THIS BLOCK FOR DESKTOPS ---
    if (filters.device_condition) {
      query = query.eq('device_condition', filters.device_condition);
    }
    // -----------------------------------

    if (filters.search) {
      query = query.or(
        `asset_id.ilike.%${filters.search}%,processor.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching desktops:', error);
    return [];
  }
}

export async function createDesktop(desktopData) {
  try {
    const { memory, storage, ...desktop } = desktopData;

    // Insert desktop
    const { data: desktopResult, error: desktopError } = await supabase
      .from('desktops')
      .insert([desktop])
      .select()
      .single();

    if (desktopError) throw desktopError;

    // Insert memory modules if provided
    if (memory && memory.length > 0) {
      const memoryData = memory.map((m) => ({
        desktop_id: desktopResult.desktop_id,
        slot_number: m.slot_number,
        size_gb: m.size_gb,
      }));

      const { error: memoryError } = await supabase
        .from('desktop_memory')
        .insert(memoryData);

      if (memoryError) throw memoryError;
    }

    // Insert storage devices if provided
    if (storage && storage.length > 0) {
      const storageData = storage.map((s) => ({
        desktop_id: desktopResult.desktop_id,
        storage_type: s.storage_type,
        capacity_gb: s.capacity_gb,
      }));

      const { error: storageError } = await supabase
        .from('desktop_storage')
        .insert(storageData);

      if (storageError) throw storageError;
    }

    return { success: true, data: desktopResult };
  } catch (error) {
    console.error('Error creating desktop:', error);
    return { success: false, error: error.message };
  }
}

export async function updateDesktop(desktopId, desktopData) {
  try {
    const { memory, storage, ...desktop } = desktopData;

    // Update desktop
    const { data: desktopResult, error: desktopError } = await supabase
      .from('desktops')
      .update(desktop)
      .eq('desktop_id', desktopId)
      .select()
      .single();

    if (desktopError) throw desktopError;

    // Update memory (delete old, insert new)
    if (memory) {
      await supabase.from('desktop_memory').delete().eq('desktop_id', desktopId);

      if (memory.length > 0) {
        const memoryData = memory.map((m) => ({
          desktop_id: desktopId,
          slot_number: m.slot_number,
          size_gb: m.size_gb,
        }));

        await supabase.from('desktop_memory').insert(memoryData);
      }
    }

    // Update storage (delete old, insert new)
    if (storage) {
      await supabase.from('desktop_storage').delete().eq('desktop_id', desktopId);

      if (storage.length > 0) {
        const storageData = storage.map((s) => ({
          desktop_id: desktopId,
          storage_type: s.storage_type,
          capacity_gb: s.capacity_gb,
        }));

        await supabase.from('desktop_storage').insert(storageData);
      }
    }

    return { success: true, data: desktopResult };
  } catch (error) {
    console.error('Error updating desktop:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDesktop(desktopId) {
  try {
    // Delete related memory and storage (should cascade automatically)
    const { error } = await supabase
      .from('desktops')
      .delete()
      .eq('desktop_id', desktopId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting desktop:', error);
    return { success: false, error: error.message };
  }
}

// ==================== MONITORS ====================

export async function getMonitors(filters = {}) {
  try {
    let query = supabase
      .from('monitors')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.brand) {
      query = query.eq('brand', filters.brand);
    }

    // --- ADD THIS BLOCK FOR MONITORS ---
    if (filters.device_condition) {
      query = query.eq('device_condition', filters.device_condition);
    }
    // -----------------------------------

    if (filters.search) {
      query = query.or(
        `asset_id.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching monitors:', error);
    return [];
  }
}

export async function createMonitor(monitorData) {
  try {
    const { data, error } = await supabase
      .from('monitors')
      .insert([monitorData])
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error creating monitor:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMonitor(monitorId, monitorData) {
  try {
    const { data, error } = await supabase
      .from('monitors')
      .update(monitorData)
      .eq('monitor_id', monitorId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error updating monitor:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMonitor(monitorId) {
  try {
    const { error } = await supabase
      .from('monitors')
      .delete()
      .eq('monitor_id', monitorId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return { success: false, error: error.message };
  }
}