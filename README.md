
# Error-bot

error-bot is a serverless cron job and uptime monitoring system built on AWS.  
It allows users to create scheduled HTTP checks through a web dashboard, stores job configuration persistently, and executes those checks automatically using AWS EventBridge Scheduler and Lambda.

This project is built using real production patterns: strict IAM separation, serverless execution, proper CORS handling, and cloud-native observability.

---

## What This Project Does

error-bot provides:

- A frontend UI to create cron jobs
- A backend API to validate and store jobs
- Automatic scheduled execution of HTTP requests
- Logging of execution results (success, failure, duration)
- Detection of real-world issues like SSL errors, DNS failures, and timeouts

It is similar in concept to hosted cron / uptime services, but fully self-hosted on AWS.

---

## High-Level Architecture

```

Frontend (React + Vercel)
|
v
API Gateway (HTTP API)
|
v
Lambda: createCronJob
|
├── DynamoDB (CronJobs table)
└── EventBridge Scheduler
|
v
Lambda: cronExecutor
|
v
HTTP target URL

````

---

## Core Components

### Frontend
- React
- Tailwind CSS
- Fetch API
- Deployed on Vercel
- No AWS credentials exposed

### Backend (AWS)
- API Gateway (HTTP API)
- AWS Lambda (Node.js, ESM)
- Amazon DynamoDB
- EventBridge Scheduler
- IAM (least-privilege roles)
- CloudWatch Logs

---

## How It Works

### 1. Job Creation
- User submits a job from the frontend
- API Gateway invokes `createCronJob`
- Job is validated and stored in DynamoDB
- An EventBridge schedule is created dynamically

### 2. Scheduled Execution
- EventBridge Scheduler triggers `cronExecutor` on schedule
- cronExecutor sends an HTTP request to the target URL
- Execution duration, status, and errors are logged

### 3. Error Detection
error-bot correctly detects and logs:
- HTTP errors (4xx / 5xx)
- DNS failures
- TLS / SSL certificate issues
- Network timeouts

Execution reflects real server conditions, not browser behavior.

---

## API Reference

### POST /jobs

Create a new cron job.

Request:
```json
{
  "name": "My Job",
  "url": "https://example.com",
  "schedule": "rate(10 minutes)"
}
````

Response:

```json
{
  "jobId": "uuid-generated-by-backend"
}
```

---

## IAM Design

This project intentionally uses multiple IAM roles, each with a single responsibility.

### createCronJob Lambda Role

* Write to DynamoDB
* Create and manage EventBridge schedules

### EventBridge Scheduler Role

* Invoke the cronExecutor Lambda

### cronExecutor Lambda Role

* Execute HTTP requests
* Log results to CloudWatch
* Optionally read/write execution data

This separation is required by AWS security design.

---

## Known and Expected Behaviors

* Websites with invalid SSL certificates will fail
* Browsers may succeed where Lambda correctly fails
* HTTPS validation is strict and not bypassed

Example:

```bash
curl https://tarsej.com
# SSL hostname mismatch -> fetch fails in Lambda
```

This is expected and treated as a valid monitoring result.

---

## Recommended Test URLs

| Purpose        | URL                                                                      |
| -------------- | ------------------------------------------------------------------------ |
| Stable success | [https://example.com](https://example.com)                               |
| JSON response  | [https://httpbin.org/get](https://httpbin.org/get)                       |
| Slow response  | [https://httpstat.us/200?sleep=5000](https://httpstat.us/200?sleep=5000) |
| HTTP failure   | [https://httpstat.us/500](https://httpstat.us/500)                       |
| SSL error      | [https://wrong.host.badssl.com](https://wrong.host.badssl.com)           |

---

## Current Limitations

* Execution history is logged but not persisted
* No pause or resume functionality
* No authentication layer
* No alerting system yet

These are intentional and planned improvements.

---

## Planned Enhancements

* Persist execution history in DynamoDB
* Job status dashboard (UP / DOWN / ERROR)
* Retry and backoff logic
* Pause and resume jobs
* Delete jobs and schedules together
* Notifications on failure
* Uptime percentage calculation

---

## Lessons Learned

* Cron systems require a dedicated scheduler service
* IAM roles must be scoped per AWS service
* Fetch API differs from Axios (`body` vs `data`)
* CloudWatch logs are the primary debugging source
* Browsers hide SSL issues that servers cannot ignore

---

## License

MIT License

---


