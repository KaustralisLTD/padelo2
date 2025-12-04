/**
 * Utility functions for exporting table data to CSV and Excel
 */

import * as XLSX from 'xlsx';

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMetadata {
  fileId?: string; // Уникальный код файла для фиксации в логах
  tournamentName?: string;
  documentType?: string; // Например: "Tournament Participants Table"
  userMessage?: string; // Сообщение пользователя, если есть
  exportedAt?: string; // Дата и время экспорта
  exportedBy?: string; // Кто экспортировал
  [key: string]: any; // Дополнительные метаданные
}

export function exportToCSV(data: any[], columns: ExportColumn[], filename: string = 'export') {
  // Create CSV header
  const headers = columns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key];
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  // Combine header and rows
  const csvContent = [headers, ...rows].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(
  data: any[], 
  columns: ExportColumn[], 
  filename: string = 'export',
  metadata?: ExportMetadata
) {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare metadata rows
  const metadataRows: any[][] = [];
  
  if (metadata) {
    if (metadata.fileId) {
      metadataRows.push(['File ID:', metadata.fileId]);
    }
    if (metadata.tournamentName) {
      metadataRows.push(['Tournament:', metadata.tournamentName]);
    }
    if (metadata.documentType) {
      metadataRows.push(['Document Type:', metadata.documentType]);
    }
    if (metadata.exportedAt) {
      metadataRows.push(['Exported At:', metadata.exportedAt]);
    }
    if (metadata.exportedBy) {
      metadataRows.push(['Exported By:', metadata.exportedBy]);
    }
    if (metadata.userMessage) {
      metadataRows.push(['User Message:', metadata.userMessage]);
    }
    if (metadataRows.length > 0) {
      metadataRows.push([]); // Empty row separator
    }
  }
  
  // Prepare header row
  const headerRow = columns.map(col => col.label);
  
  // Find phone column index
  const phoneColIndex = columns.findIndex(col => 
    col.key === 'Phone' || 
    col.label === 'Phone' || 
    col.key.toLowerCase().includes('phone') ||
    col.label.toLowerCase().includes('phone')
  );
  
  // Prepare data rows with proper formatting
  const dataRows = data.map(row => {
    return columns.map((col, colIdx) => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      
      // For Phone column, always format as text to prevent scientific notation
      if (colIdx === phoneColIndex) {
        const phoneStr = String(value).trim();
        // If it's a number that looks like a phone, prefix with ' to force text format
        if (/^\d+$/.test(phoneStr) && phoneStr.length > 8) {
          return `'${phoneStr}`;
        }
        return phoneStr;
      }
      
      // For numeric values that should be text (like IDs starting with 0 or long numbers)
      if (typeof value === 'number' && String(value).length > 10) {
        return `'${value}`;
      }
      
      return value;
    });
  });
  
  // Combine all rows
  const allRows = [...metadataRows, headerRow, ...dataRows];
  
  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allRows);
  
  // Set column widths
  const colWidths = columns.map((col, idx) => {
    // Wider columns for certain fields
    if (col.key === 'Name' || col.label === 'Name') return { wch: 25 };
    if (col.key === 'Email' || col.label === 'Email') return { wch: 30 };
    if (col.key === 'Categories' || col.label === 'Categories') return { wch: 20 };
    if (idx === phoneColIndex) return { wch: 18 }; // Phone column
    return { wch: 15 };
  });
  worksheet['!cols'] = colWidths;
  
  // Format header row (row after metadata)
  const headerRowIndex = metadataRows.length;
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  
  // Format phone column as text for all data rows
  if (phoneColIndex >= 0) {
    for (let row = headerRowIndex + 1; row <= range.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: phoneColIndex });
      if (worksheet[cellAddress]) {
        // Force text format by setting cell type and format
        const cellValue = worksheet[cellAddress].v;
        if (cellValue !== null && cellValue !== undefined) {
          // If value doesn't start with ', add it to force text
          const strValue = String(cellValue);
          if (!strValue.startsWith("'")) {
            worksheet[cellAddress].v = `'${strValue}`;
          }
          worksheet[cellAddress].t = 's'; // string type
          worksheet[cellAddress].z = '@'; // text format code
        }
      }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Generate file (without cellStyles as it's not fully supported in browser)
  const excelBuffer = XLSX.write(workbook, { 
    bookType: 'xlsx', 
    type: 'array'
  });
  
  // Create blob and download
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xlsx`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Log export action if fileId provided
  if (metadata?.fileId) {
    // Можно отправить на сервер для логирования
    console.log('Export logged:', metadata.fileId);
  }
}

export function printTable(data: any[], columns: ExportColumn[], metadata?: ExportMetadata) {
  // Escape HTML to prevent XSS
  const escapeHtml = (text: any): string => {
    if (text === null || text === undefined) return '';
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  const metadataHtml = metadata ? `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
      ${metadata.fileId ? `<p><strong>File ID:</strong> ${escapeHtml(metadata.fileId)}</p>` : ''}
      ${metadata.tournamentName ? `<p><strong>Tournament:</strong> ${escapeHtml(metadata.tournamentName)}</p>` : ''}
      ${metadata.documentType ? `<p><strong>Document Type:</strong> ${escapeHtml(metadata.documentType)}</p>` : ''}
      ${metadata.exportedAt ? `<p><strong>Exported At:</strong> ${escapeHtml(metadata.exportedAt)}</p>` : ''}
      ${metadata.exportedBy ? `<p><strong>Exported By:</strong> ${escapeHtml(metadata.exportedBy)}</p>` : ''}
      ${metadata.userMessage ? `<p><strong>User Message:</strong> ${escapeHtml(metadata.userMessage)}</p>` : ''}
    </div>
  ` : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print - ${escapeHtml(metadata?.documentType || 'Table')}</title>
        <style>
          @media print {
            @page {
              margin: 1cm;
            }
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #000;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2; 
            font-weight: bold; 
          }
          tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
        </style>
      </head>
      <body>
        ${metadataHtml}
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${escapeHtml(col.label)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td>${escapeHtml(row[col.key] ?? '')}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  
  // Try to open print window
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  } else {
    // Fallback: create a hidden iframe and print it
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  }
}

