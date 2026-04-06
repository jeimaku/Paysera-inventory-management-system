import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper function to fetch and format deployment history for a batch of monitors
 */
const enrichMonitorData = async (monitors, getDeviceUsageHistory) => {
  return Promise.all(
    monitors.map(async (monitor) => {
      try {
        const history = await getDeviceUsageHistory('MONITOR', monitor.monitor_id);
        
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
              const start = h.date_issued ? new Date(h.date_issued).toLocaleDateString() : 'Unknown Start';
              const end = h.date_returned ? new Date(h.date_returned).toLocaleDateString() : 'Unknown Return';
              return `${name} (${start} to ${end})`;
            }).join(' | ')
          : 'No previous history';

        // Format monitor specs nicely
        const sizeInfo = monitor.size_inches ? `${monitor.size_inches}"` : '';
        const resInfo = monitor.resolution || '';
        const refreshInfo = monitor.refresh_rate || '';
        const specs = `${sizeInfo} ${resInfo} ${refreshInfo}`.trim().replace(/\s+/g, ' ');

        return {
          'Asset ID': monitor.asset_id || 'N/A',
          'Brand & Model': `${monitor.brand || ''} ${monitor.model || ''}`.trim() || 'N/A',
          'Specs': specs || 'N/A',
          'Serial Number': monitor.serial_number || 'N/A',
          'Status': monitor.status ? monitor.status.toUpperCase() : 'UNKNOWN',
          'Current User': currentUser,
          'History Logs': historyLogs,
          'Warranty Expiry': monitor.warranty_end ? new Date(monitor.warranty_end).toLocaleDateString() : 'No Warranty',
        };
      } catch (error) {
        console.error(`Failed to fetch history for ${monitor.asset_id}:`, error);
        // Fallback if history fetching fails for a specific device
        return {
          'Asset ID': monitor.asset_id || 'N/A',
          'Brand & Model': `${monitor.brand || ''} ${monitor.model || ''}`.trim() || 'N/A',
          'Specs': `${monitor.size_inches || ''} ${monitor.resolution || ''}`.trim() || 'N/A',
          'Serial Number': monitor.serial_number || 'N/A',
          'Status': monitor.status ? monitor.status.toUpperCase() : 'UNKNOWN',
          'Current User': 'Error fetching data',
          'History Logs': 'Error fetching data',
          'Warranty Expiry': monitor.warranty_end ? new Date(monitor.warranty_end).toLocaleDateString() : 'No Warranty',
        };
      }
    })
  );
};

export const exportMonitorsToExcel = async (monitors, getDeviceUsageHistory) => {
  if (!monitors || monitors.length === 0) return false;

  // Sort monitors alphanumerically by Asset ID before processing
  const sortedMonitors = [...monitors].sort((a, b) => {
    const idA = a.asset_id || '';
    const idB = b.asset_id || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  const data = await enrichMonitorData(sortedMonitors, getDeviceUsageHistory);
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Adjust column widths for better readability
  const colWidths = [
    { wch: 15 }, // Asset ID
    { wch: 25 }, // Brand & Model
    { wch: 20 }, // Specs
    { wch: 20 }, // Serial Number
    { wch: 15 }, // Status
    { wch: 25 }, // Current User
    { wch: 60 }, // History Logs
    { wch: 15 }, // Warranty Expiry
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitor Inventory');
  XLSX.writeFile(workbook, `Monitor_Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  return true;
};

export const exportMonitorsToPDF = async (monitors, getDeviceUsageHistory) => {
  if (!monitors || monitors.length === 0) return false;

  // Sort monitors alphanumerically by Asset ID before processing
  const sortedMonitors = [...monitors].sort((a, b) => {
    const idA = a.asset_id || '';
    const idB = b.asset_id || '';
    return idA.localeCompare(idB, undefined, { numeric: true });
  });

  const data = await enrichMonitorData(sortedMonitors, getDeviceUsageHistory);
  
  // Initialize jsPDF in landscape mode
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(18);
  doc.text('Monitor Inventory Report', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableColumns = ["Asset ID", "Brand & Model", "Specs", "Serial Num", "Status", "Current User", "History Logs", "Warranty Expiry"];
  const tableRows = data.map(row => [
    row['Asset ID'],
    row['Brand & Model'],
    row['Specs'],
    row['Serial Number'],
    row['Status'],
    row['Current User'],
    row['History Logs'],
    row['Warranty Expiry']
  ]);

  // Use the standalone autoTable function
  autoTable(doc, {
    startY: 36,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      6: { cellWidth: 70 }  // Give the history logs column more breathing room
    },
    didDrawPage: function (data) {
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`Monitor_Inventory_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};