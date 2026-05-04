const http = require('http');

async function run() {
  // Login to check state
  let res = await fetch('http://localhost:3000/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tam.agriviet@gmail.com', password: '123456789' })
  });
  let data = await res.json();
  console.log('Initial departments:', data.state.departments);

  // Dispatch ADD_DEPARTMENT
  res = await fetch('http://localhost:3000/api/dispatch', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'ADD_DEPARTMENT',
      payload: { id: 'test-dept-123', name: 'Test Department', createdAt: new Date().toISOString() }
    })
  });
  data = await res.json();
  console.log('After dispatch db.departments:', data.db.departments);

  // Login again
  res = await fetch('http://localhost:3000/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tam.agriviet@gmail.com', password: '123456789' })
  });
  data = await res.json();
  console.log('Final departments from login:', data.state.departments);
}
run();
