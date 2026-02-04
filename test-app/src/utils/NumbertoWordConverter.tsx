export const numberToWords = (num: number | string): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };
  
  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 1000) return convertLessThanThousand(n);
    if (n < 1000000) {
      return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertLessThanThousand(n % 1000) : '');
    }
    if (n < 1000000000) {
      return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    }
    return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
  };
  
  const [integerPart, decimalPart] = num.toString().split('.');
  let result = convert(parseInt(integerPart));
  
  if (decimalPart && parseInt(decimalPart) > 0) {
    const fils = parseInt(decimalPart.padEnd(2, '0').slice(0, 2));
    result += ' Dirhams and ' + convert(fils) + ' Fils';
  } else {
    result += ' Dirhams';
  }
  
  return result + ' Only';
};