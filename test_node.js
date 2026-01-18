console.log('Test log');
console.error('Test error');
const fs = require('fs');
fs.writeFileSync('test_output.txt', 'File write working');
process.exit(0);
