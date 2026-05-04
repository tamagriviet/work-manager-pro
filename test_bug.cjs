const io = require('socket.io-client');
const http = require('http');

async function run() {
  console.log("Adding department via socket...");
  const socket = io('http://localhost:3000');
  socket.emit('dispatch', {
    type: 'ADD_DEPARTMENT',
    payload: { id: 'test_dept', name: 'Test Department' }
  });
  
  await new Promise(r => setTimeout(r, 1000));
  socket.close();
  
  console.log("Fetching login...");
  const req = http.request('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const state = JSON.parse(data).state;
      console.log("Departments found:", state.departments);
      process.exit(0);
    });
  });
  req.write(JSON.stringify({ email: 'tam.agriviet@gmail.com', password: '123456789' }));
  req.end();
}
run();
