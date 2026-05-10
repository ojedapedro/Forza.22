
export const formatDate = (date: string | Date | number | undefined | null) => {
  if (!date) return '';
  
  // Handle ISO strings or YYYY-MM-DD strings
  let d: Date;
  if (typeof date === 'string' && date.includes('T')) {
    d = new Date(date);
  } else if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Manual parsing for YYYY-MM-DD to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    d = new Date(year, month - 1, day);
  } else {
    d = new Date(date);
  }

  if (isNaN(d.getTime())) return String(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export const formatDateTime = (date: string | Date | number | undefined | null) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const formatTime = (date: string | Date | number | undefined | null) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
};

export const getFrequencyDays = (frequency: string): number => {
  switch (frequency) {
    case 'Anual': return 365;
    case 'Semestral': return 180;
    case 'Cuatrimestral': return 120;
    case 'Trimestral': return 90;
    case 'Mensual': return 30;
    case 'Quincenal': return 15;
    case 'Semanal': return 7;
    case 'Diario': return 1;
    default: return 0;
  }
};

export const calculateNextDueDate = (currentDate: string, frequency: string): string => {
  // Parse YYYY-MM-DD manually to avoid timezone issues
  const parts = currentDate.split('-');
  if (parts.length !== 3) return currentDate;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return currentDate;

  switch (frequency) {
    case 'Anual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'Semestral':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'Cuatrimestral':
      date.setMonth(date.getMonth() + 4);
      break;
    case 'Trimestral':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'Mensual':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Quincenal':
      date.setDate(date.getDate() + 15);
      break;
    case 'Semanal':
      date.setDate(date.getDate() + 7);
      break;
    case 'Diario':
      date.setDate(date.getDate() + 1);
      break;
    default:
      return currentDate;
  }

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

export const splitMessage = (message: string, limit: number = 1500): string[] => {
  if (message.length <= limit) return [message];
  
  const chunks: string[] = [];
  let currentPos = 0;
  
  while (currentPos < message.length) {
    let endPos = currentPos + limit;
    if (endPos >= message.length) {
      chunks.push(message.substring(currentPos));
      break;
    }
    
    // Try to find a good place to split (newline or space)
    let lastIndex = message.lastIndexOf('\n', endPos);
    if (lastIndex <= currentPos) {
      lastIndex = message.lastIndexOf(' ', endPos);
    }
    
    if (lastIndex > currentPos) {
      endPos = lastIndex;
    }
    
    chunks.push(message.substring(currentPos, endPos));
    currentPos = endPos;
  }
  
  return chunks;
};
