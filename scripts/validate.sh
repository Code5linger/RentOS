#!/bin/bash
# scripts/validate.sh

set -e

BASE_URL="http://localhost:3000"

echo "── RentOS Startup Validation ──"

# 1. Health check
echo -n "Health check... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
if [ "$STATUS" = "200" ]; then
  echo "✅ ($STATUS)"
else
  echo "❌ ($STATUS)"
  curl -s "$BASE_URL/health" | jq .
  exit 1
fi

# 2. Register owner
echo -n "Register owner... "
OWNER=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke@rentos.test","password":"Password1","role":"OWNER"}')
TOKEN=$(echo $OWNER | jq -r '.data.accessToken')
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✅"
else
  echo "❌"
  echo $OWNER | jq .
  exit 1
fi

# 3. Create property
echo -n "Create property... "
PROP=$(curl -s -X POST "$BASE_URL/api/v1/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Smoke Test Property","address":"123 Test Street"}')
PROP_ID=$(echo $PROP | jq -r '.data.id')
if [ "$PROP_ID" != "null" ] && [ -n "$PROP_ID" ]; then
  echo "✅ ($PROP_ID)"
else
  echo "❌"
  echo $PROP | jq .
  exit 1
fi

echo ""
echo "── All checks passed ✅ RentOS is operational ──"