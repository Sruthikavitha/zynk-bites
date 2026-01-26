#!/bin/bash
# Test script for ZYNK Backend

echo "🧪 ZYNK Backend Testing Suite"
echo "=============================="
echo ""

API_URL="${1:-http://localhost:5000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "Test 1: Health Check"
RESPONSE=$(curl -s -X GET "$API_URL/api/health" -H "Content-Type: application/json")
if echo "$RESPONSE" | grep -q "ok"; then
  echo -e "${GREEN}✓ PASSED${NC} - Backend is healthy"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ FAILED${NC} - Backend health check failed"
  echo "Response: $RESPONSE"
  exit 1
fi
echo ""

# Test 2: Register User
echo "Test 2: Register New User"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "Test@123",
    "name": "Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ PASSED${NC} - User registration successful"
  echo "Response: $REGISTER_RESPONSE"
  USER_EMAIL=$(echo "$REGISTER_RESPONSE" | grep -o '"email":"[^"]*"' | head -1)
else
  echo -e "${RED}✗ FAILED${NC} - User registration failed"
  echo "Response: $REGISTER_RESPONSE"
fi
echo ""

# Test 3: Login
echo "Test 3: Login"
TEST_EMAIL="test$(date +%s)@example.com"
# First register
curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "Test@123",
    "name": "Test User"
  }' > /dev/null

# Then login
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "Test@123"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "success"; then
  echo -e "${GREEN}✓ PASSED${NC} - Login successful"
  echo "Response: $LOGIN_RESPONSE"
else
  echo -e "${RED}✗ FAILED${NC} - Login failed"
  echo "Response: $LOGIN_RESPONSE"
fi
echo ""

echo "=============================="
echo "✅ Testing Complete"
