// Quick test of currency formatting
const { formatCurrency, getCurrencySymbol, formatIndianCurrency } = require('./app/lib/currencyUtils.js');

console.log('Testing Currency Formatting:');
console.log('formatCurrency(1000):', formatCurrency(1000));
console.log('formatCurrency(50000):', formatCurrency(50000));  
console.log('formatCurrency(123456):', formatCurrency(123456));
console.log('getCurrencySymbol("INR"):', getCurrencySymbol('INR'));
console.log('getCurrencySymbol("USD"):', getCurrencySymbol('USD'));
console.log('formatIndianCurrency(1500000):', formatIndianCurrency(1500000));
console.log('formatIndianCurrency(25000000):', formatIndianCurrency(25000000));