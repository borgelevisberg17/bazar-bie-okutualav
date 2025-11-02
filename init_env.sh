#!/bin/bash
pkill node
pkill live-server
cd server
node migrate_local.js
node scripts/seed.js
nohup npm run dev > /tmp/backend-server.log 2>&1 &
cd ../frontend/public
nohup live-server --proxy=/api:http://localhost:4000 > /tmp/live-server.log 2>&1 &
