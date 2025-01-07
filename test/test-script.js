import http from "k6/http";
import { check, sleep } from "k6";

// Test options
export let options = {
    // 10 lakhs
    // stages: [
    //     { duration: '30s', target: 10 },    // Ramp up to 10 VUs over 30 seconds
    //     { duration: '1m', target: 100 },    // Spike to 100 VUs for 1 minute
    //     { duration: '1m', target: 100 },    // Sustain 100 VUs for 1 minute
    //     { duration: '30s', target: 0 },     // Ramp down to 0 VUs over 30 seconds
    // ],
    // 5k
    stages: [
        { duration: '20s', target: 5 },    // Ramp up to 5 VUs over 20 seconds
        { duration: '1m', target: 50 },    // Spike to 50 VUs for 1 minute
        { duration: '2m', target: 50 },    // Sustain 50 VUs for 2 minutes
        { duration: '20s', target: 0 },    // Ramp down to 0 VUs over 20 seconds
    ],
    thresholds: {
        'http_req_duration': ['p(95)<2000'],  // 95% of requests should be under 2 seconds
    },
};

export default function () {
    // const url = "http://localhost:3000/produce";  // Your Kafka producer endpoint
    const url = 'http://host.docker.internal:3000/produce';
    const res = http.post(url, {});  // POST request to trigger Kafka producer

    // Check the response status
    check(res, {
        'is status 200': (r) => r.status === 200,
    });

    console.log(`Status code: ${res.status}`);  // Log the response status

    sleep(1);  // Sleep to simulate a realistic load
}
