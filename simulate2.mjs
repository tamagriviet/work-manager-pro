import fetch from 'node-fetch';

async function run() {
  const payload1 = {
    id: "test_task2",
    status: "WAITING_APPROVAL",
    updatedAt: new Date().toISOString(),
    waitingApprovalAt: new Date().toISOString()
  };
  
  // Add task first
  await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ADD_TASK', payload: { id: "test_task2", content: "Test2", status: "NOT_STARTED", createdAt: new Date().toISOString() } })
  });

  // Update status
  await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'UPDATE_TASK_STATUS', payload: payload1 })
  });
  
  // Simulate another update like UPDATE_TASK_CONTENT
  await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'UPDATE_TASK_CONTENT', payload: { id: "test_task2", content: "Updated content", updatedAt: new Date().toISOString() } })
  });

  // Fetch state via a generic request
  let res = await fetch('http://localhost:45001/api/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'UNKNOWN_ACTION' })
  });
  let data = await res.json();
  console.log("Task after all updates:", data.db.tasks.find(t => t.id === "test_task2"));
}

run();
