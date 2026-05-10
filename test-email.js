import http from 'http';

const postData = JSON.stringify({
  entries: [{ id: 1, employeeEmail: 'test@example.com', employeeName: 'Test', month: 'April', baseSalary: 1000, totalWorkerNet: 1000, bonuses: [], deductions: [] }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payroll/send-emails',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
