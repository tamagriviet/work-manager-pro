import fetch from 'node-fetch';

async function run() {
  let res = await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ADD_TASK', payload: { id: "test_task", content: "Test", status: "NOT_STARTED" } })
  });
  let data = await res.json();
  
  // Set to WAITING_APPROVAL
  const payload1 = {
    id: "test_task",
    status: "WAITING_APPROVAL",
    updatedAt: new Date().toISOString(),
    waitingApprovalAt: new Date().toISOString()
  };
  res = await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'UPDATE_TASK_STATUS', payload: payload1 })
  });
  data = await res.json();
  console.log("After WAITING_APPROVAL:", data.db.tasks.find(t => t.id === "test_task"));

  // Set back to IN_PROGRESS
  const payload2 = {
    id: "test_task",
    status: "IN_PROGRESS",
    updatedAt: new Date().toISOString()
  };
  res = await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'UPDATE_TASK_STATUS', payload: payload2 })
  });
  data = await res.json();
  console.log("After IN_PROGRESS:", data.db.tasks.find(t => t.id === "test_task"));
}

run();
