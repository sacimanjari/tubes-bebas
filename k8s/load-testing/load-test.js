import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Test GET /api/guestbook
  const getResponse = http.get(`${BASE_URL}/api/guestbook`);
  check(getResponse, {
    'get status is 200': (r) => r.status === 200,
    'get response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test POST /api/guestbook
  const payload = JSON.stringify({
    name: 'Load Test User',
    message: 'This is a load test message',
  });

  const postResponse = http.post(`${BASE_URL}/api/guestbook`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(postResponse, {
    'post status is 201': (r) => r.status === 201,
    'post response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
} 