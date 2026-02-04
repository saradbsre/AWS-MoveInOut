/**
 * Formats a date to dd/mmm/yyyy format
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string or 'N/A' if invalid
 */
function parseDbDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  if (typeof date === 'string') {
    // Parse as local time (Dubai time)
    // Format: "YYYY-MM-DD HH:mm:ss.SSS"
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
    if (match) {
      const [ , year, month, day, hour, min, sec, ms ] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(min),
        Number(sec),
        Number(ms || 0)
      );
    }
    return null;
  }
  return isNaN(date.getTime()) ? null : date;
}

export const formatDateShort = (date: string | Date | null | undefined): string => {
  const dateObj = parseDbDate(date);
  if (!dateObj) return 'N/A';
  const day = dateObj.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTimeLong = (date: string | Date | null | undefined): string => {
  const dateObj = parseDbDate(date);
  if (!dateObj) return 'N/A';
  const day = dateObj.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`;
};

export const formatBarcodeDate = (date: string | Date | null | undefined): string => {
  const dateObj = parseDbDate(date);
  if (!dateObj) return 'N/A';
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
};

/**
 * Gets current date in dd/mmm/yyyy format
 * @returns Current date formatted as dd/mmm/yyyy
 */
export const getCurrentDateShort = (): string => {
  return formatDateShort(new Date());
};

/**
 * Gets current date and time in dd/mmm/yyyy hh:mm AM/PM format
 * @returns Current date-time formatted as dd/mmm/yyyy hh:mm AM/PM
 */
export const getCurrentDateTimeLong = (): string => {
  return formatDateTimeLong(new Date());
};

/**
 * Gets current date and time in dd/mmm/yyyy hh:mm format
 * @returns Current date-time formatted as dd/mmm/yyyy hh:mm AM/PM
 */
export const getCurrentDateBarcode = (): string => {
  return formatBarcodeDate(new Date());
};