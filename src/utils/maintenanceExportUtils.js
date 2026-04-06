import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Helper function to format the maintenance records for exporting.
 * We sort them by newest first (Date Reported).
 */
const formatMaintenanceData = (records, deviceDetails) => {
  // Sort records by newest first based on date_reported
  const sortedRecords = [...records].sort((a, b) => new Date(b.date_reported) - new Date(a.date_reported));

  return sortedRecords.map((record) => {
    // If viewing all records, the backend usually provides device_asset_id.
    // If viewing a specific device, we use the deviceDetails passed down.
    const deviceStr = record.device_asset_id 
      ? `${record.device_asset_id} (${record.device_type})` 
      : (deviceDetails ? deviceDetails.asset_id : 'N/A');

    const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';

    return {
      'Device': deviceStr,
      'Type': (record.maintenance_type || 'Unknown').toUpperCase(),
      'Issue Description': record.issue_description || 'No description',
      'Warranty': record.warranty_status_at_repair === 'active' ? 'Active' : 'Expired',
      'Status': record.status ? record.status.toUpperCase() : 'UNKNOWN',
      'Approval': record.admin_approval_status ? record.admin_approval_status.toUpperCase() : 'PENDING',
      'Priority': record.priority ? record.priority.toUpperCase() : 'N/A',
      'Technician': record.technician_name || 'Unassigned',
      'Dates': `Reported: ${formatDate(record.date_reported)}\nStarted: ${formatDate(record.date_started)}\nCompleted: ${formatDate(record.date_completed)}`
    };
  });
};

export const exportMaintenanceToExcel = (records, deviceDetails) => {
  if (!records || records.length === 0) return false;

  const data = formatMaintenanceData(records, deviceDetails);
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  // Adjust column widths for readability
  const colWidths = [
    { wch: 20 }, // Device
    { wch: 15 }, // Type
    { wch: 45 }, // Issue Description
    { wch: 15 }, // Warranty
    { wch: 15 }, // Status
    { wch: 15 }, // Approval
    { wch: 15 }, // Priority
    { wch: 20 }, // Technician
    { wch: 30 }, // Dates
  ];
  worksheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Maintenance History');
  XLSX.writeFile(workbook, `Maintenance_History_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  return true;
};

export const exportMaintenanceToPDF = (records, deviceDetails) => {
  if (!records || records.length === 0) return false;

  const data = formatMaintenanceData(records, deviceDetails);
  
  // Initialize jsPDF in landscape mode for multiple columns
  const doc = new jsPDF({ orientation: 'landscape' });
  
  doc.setFontSize(18);
  doc.text('Maintenance & Repair History Report', 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

  const tableColumns = ["Device", "Type", "Issue Description", "Warranty", "Status", "Approval", "Priority", "Technician", "Timeline"];
  const tableRows = data.map(row => [
    row['Device'],
    row['Type'],
    row['Issue Description'],
    row['Warranty'],
    row['Status'],
    row['Approval'],
    row['Priority'],
    row['Technician'],
    row['Dates']
  ]);

  autoTable(doc, {
    startY: 36,
    head: [tableColumns],
    body: tableRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      2: { cellWidth: 50 }, // Give issue description room to wrap
      8: { cellWidth: 40 }  // Give dates room for multi-line
    },
    didDrawPage: function (data) {
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(str, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`Maintenance_History_Export_${new Date().toISOString().split('T')[0]}.pdf`);
  return true;
};