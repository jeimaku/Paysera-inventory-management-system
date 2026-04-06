import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper function to fetch and format deployment history for a batch of laptops
 */
const enrichLaptopData = async (laptops, getDeviceUsageHistory) => {
  return Promise.all(
    laptops.map(async (laptop) => {
      try {
        const history = await getDeviceUsageHistory('LAPTOP', laptop.laptop_id);
        
        // Find current user
        const activeDeployment = history.find((h) => h.status === 'in_use');
        const currentUser = activeDeployment?.employees?.full_name 
            || activeDeployment?.archived_owner_name 
            || 'Not Assigned';

        // Format history logs (excluding the current active one)
        const pastDeployments = history.filter((h) => h.status !== 'in_use');
        const historyLogs = pastDeployments.length > 0
          ? pastDeployments.map(h => {
              const name = h.employees?.full_name || h.archived_owner_name || 'Unknown User';
              const start = new Date(h.date_issued).toLocaleDateString();
              const end = h.date_returned ? new Date(h.date_returned).toLocaleDateString() : 'Unknown Return';
              return `${name} (${start} to ${end})`;
            }).join(' | ')
          : 'No previous history';

        return {
          'Asset ID': laptop.asset_id || 'N/A',
          'Brand': laptop.brand || 'N/A',
          'Model': laptop.model || 'N/A',
          'Status': laptop.status ? laptop.status.toUpperCase() : 'UNKNOWN',
          'Current User': currentUser,
          'History Logs': historyLogs,
          'Warranty Expiry': laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'No Warranty',
        };
      } catch (error) {
        console.error(`Failed to fetch history for ${laptop.asset_id}:`, error);
        // Fallback if history fetching fails for a specific device
        return {
          'Asset ID': laptop.asset_id || 'N/A',
          'Brand': laptop.brand || 'N/A',
          'Model': laptop.model || 'N/A',
          'Status': laptop.status ? laptop.status.toUpperCase() : 'UNKNOWN',
          'Current User': 'Error fetching data',
          'History Logs': 'Error fetching data',
          'Warranty Expiry': laptop.warranty_end ? new Date(laptop.warranty_end).toLocaleDateString() : 'No Warranty',
        };
      }
    })
  );
};

export const exportLaptopsToExcel = async (laptops, getDeviceUsageHistory) => {
  if (!laptops || laptops.length === 0) return false;

  // Sort laptops alphanumerically by Asset ID before processing
  const sortedLaptops = [...laptops].sort((a, b) => {
    const idA = a.asset_id || '';
    const idB = b.asset_id || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  const data = await enrichLaptopData(sortedLaptops, getDeviceUsageHistory);
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Adjust column widths for better readability
  const colWidths = [
    { wch: 15 }, // Asset ID
    { wch: 15 }, // Brand
    { wch: 20 }, // Model
    { wch: 15 }, // Status
    { wch: 25 }, // Current User
    { wch: 60 }, // History Logs
    { wch: 15 }, // Warranty Expiry
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laptop Inventory');
  XLSX.writeFile(workbook, `Laptop_Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  return true;
};

export const exportLaptopsToPDF = async (laptops, getDeviceUsageHistory) => {
  if (!laptops || laptops.length === 0) return false;

  // Sort laptops alphanumerically by Asset ID before processing
  const sortedLaptops = [...laptops].sort((a, b) => {
    const idA = a.asset_id || '';
    const idB = b.asset_id || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  const data = await enrichLaptopData(sortedLaptops, getDeviceUsageHistory);
  
  // Initialize jsPDF in landscape mode
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(18);
  doc.text('Laptop Inventory Report', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableColumns = ["Asset ID", "Brand", "Model", "Status", "Current User", "History Logs", "Warranty Expiry"];
  const tableRows = data.map(row => [
    row['Asset ID'],
    row['Brand'],
    row['Model'],
    row['Status'],
    row['Current User'],
    row['History Logs'],
    row['Warranty Expiry']
  ]);

  // Use the standalone autoTable function (Safe for Vite/modern bundlers)
  autoTable(doc, {
    startY: 36,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      5: { cellWidth: 80 } // Give the history logs column more breathing room
    },
    didDrawPage: function (data) {
      // Add pagination
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`Laptop_Inventory_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};