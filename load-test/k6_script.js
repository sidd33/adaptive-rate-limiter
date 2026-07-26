import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,        // 20 virtual users hitting the server concurrently
  duration: '15s', // run for 15 seconds
};

export default function () {
  const res = http.get('http://localhost:3000/api/login');

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.1); // small pause so it's a steady stream, not one instant spike
}