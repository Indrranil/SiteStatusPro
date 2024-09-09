# Website Monitoring and Reporting System

## Features

- **Website Status Monitoring**: Track and display the status of monitored websites.
- **Real-Time Graphs**: Line graphs show user reports over time.
- **Issue Reporting**: Users can report problems via predefined options.
- **Historical Data**: View website outage history and common issues.

## Project Structure

- **Backend**: REST API using Node.js, Express.js
  - **Endpoints**: `/api/website/:website`, `/api/reports/:website`
  - **Data Storage**: MongoDB
- **Frontend**: React.js with React Router for navigation
  - **Components**: `StatusChecker`, `WebsiteDetails`, `ReportIssue`
  - **Charts**: Chart.js for line and pie charts

## Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name

   # For the server
   cd ../server
   npm install
   npm start

   # For the client
   cd ../client
   npm install
   npm start

    ```bash
