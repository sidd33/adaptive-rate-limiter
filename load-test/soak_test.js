import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 15,
  duration: '2m', // sustained for 2 minutes instead of 15-20 seconds
};

export default function () {
  const res = http.get('http://localhost:3000/api/billing'); // sliding window log

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.2);
}