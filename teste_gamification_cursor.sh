#!/bin/bash

echo "Testando rotas de gamificação do backend..."

BASE_URL="http://localhost:3000/api/gamification"

for endpoint in stats badges achievements leaderboard weekly-challenges; do
  echo -e "\n🔗 Testando $BASE_URL/$endpoint"
  curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/$endpoint"
done
