#!/bin/bash
# test_api.sh - Test script to verify API endpoints

echo "🧪 Testing ClickUp Clone API..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:8000/health | jq '.' || echo "Health endpoint failed"

# Test API docs
echo -e "\n2. Testing API documentation..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
echo " - API docs response code"

# Test auth endpoint with demo credentials
echo -e "\n3. Testing login with demo credentials..."
TOKEN=$(curl -s -X POST "http://localhost:8000/api/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=demo@example.com&password=demo123" | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "✅ Login successful! Token: ${TOKEN:0:20}..."
  
  # Test authenticated endpoint
  echo -e "\n4. Testing dashboard endpoint..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/v1/dashboard | jq '.task_summary' || echo "Dashboard endpoint failed"
    
  echo -e "\n5. Testing current user endpoint..."
  curl -s -H "Authorization: Bearer $TOKEN" \
    http://localhost:8000/api/v1/auth/me | jq '.email' || echo "User endpoint failed"
else
  echo "❌ Login failed!"
fi

echo -e "\n6. Testing available endpoints..."
echo "Available endpoints should include:"
echo "  - POST /api/v1/auth/token"
echo "  - GET  /api/v1/auth/me" 
echo "  - GET  /api/v1/dashboard"
echo "  - GET  /api/v1/notifications/"
echo "  - GET  /api/v1/workspaces/"
echo "  - GET  /api/v1/projects/"