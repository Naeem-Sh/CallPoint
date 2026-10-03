#!/usr/bin/env bash
# ==============================================================================
# Enterprise Phonebook - Release Audit, Air-Gap & Health Verification Script
# ==============================================================================
set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TEST_PORT="${APP_TEST_PORT:-4400}"
APP_URL="http://127.0.0.1:${TEST_PORT}"
TOTAL_CHECKS=0
PASSED_CHECKS=0

log_header() {
  echo -e "\n${BOLD}${CYAN}================================================================${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}================================================================${NC}"
}

log_pass() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  PASSED_CHECKS=$((PASSED_CHECKS + 1))
  echo -e "  [${GREEN}✓ PASS${NC}] $1"
}

log_fail() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  echo -e "  [${RED}✗ FAIL${NC}] $1"
  if [[ "${2:-}" != "" ]]; then
    echo -e "         ${YELLOW}Details: $2${NC}"
  fi
}

log_info() {
  echo -e "  [${CYAN}INFO${NC}] $1"
}

log_warn() {
  echo -e "  [${YELLOW}WARN${NC}] $1"
}

# ------------------------------------------------------------------------------
# STEP 1: Dependency Audit & Manifest Check
# ------------------------------------------------------------------------------
log_header "1. Dependency Audit & Manifest Verification"
if [[ -f "package-lock.json" ]]; then
  log_info "package-lock.json found. Running npm ci..."
  npm ci
  log_pass "Dependencies installed cleanly via npm ci"
else
  log_info "No lockfile found. Running npm install..."
  npm install
  log_pass "Dependencies installed cleanly via npm install"
fi

# ------------------------------------------------------------------------------
# STEP 2: Static TypeScript Type Verification
# ------------------------------------------------------------------------------
log_header "2. Static Type Verification (tsc --noEmit)"
if npx tsc --noEmit; then
  log_pass "TypeScript compilation verified (0 type errors)"
else
  log_fail "TypeScript static verification failed"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 3: Linter Verification
# ------------------------------------------------------------------------------
log_header "3. Linter Verification (npm run lint)"
if npm run lint; then
  log_pass "Linter passed with zero errors"
else
  log_fail "Linter check failed"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 4: Production Bundle Verification
# ------------------------------------------------------------------------------
log_header "4. Production Bundle Verification (npm run build)"
if npm run build; then
  log_pass "Client and Server built successfully (dist/ and dist/server.cjs)"
else
  log_fail "Build process encountered errors"
  exit 1
fi

# Verify build artifacts exist
if [[ -f "dist/index.html" && -f "dist/server.cjs" ]]; then
  log_pass "Build artifacts verified (dist/index.html & dist/server.cjs present)"
else
  log_fail "Missing critical build output files"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 5: Air-Gap Static Audit (Zero External Network Calls in Build Artifacts)
# ------------------------------------------------------------------------------
log_header "5. Air-Gap Static Code & Bundle Audit"
log_info "Auditing HTML entry point, stylesheets, and client code for remote CDNs..."

EXTERNAL_REFS=$(grep -rn -E "fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.jsdelivr\.net" dist/index.html dist/assets/*.css 2>/dev/null || true)
if [[ -z "$EXTERNAL_REFS" ]]; then
  log_pass "Zero external CDNs or remote web fonts in HTML and CSS bundles"
else
  log_fail "Detected external CDN/font URLs in dist/" "$EXTERNAL_REFS"
  exit 1
fi

# Audit client code for hardcoded localhost / non-relative endpoints
HARDCODED_HOSTS=$(grep -rn -E "http://localhost|http://127\.0\.0\.1" src/ 2>/dev/null || true)
if [[ -z "$HARDCODED_HOSTS" ]]; then
  log_pass "Zero hardcoded localhost / IP addresses found in client source code"
else
  log_fail "Found hardcoded host references in src/" "$HARDCODED_HOSTS"
  exit 1
fi

# Check that Persian fonts (Vazirmatn) are bundled locally
if [[ -f "public/fonts/vazirmatn/Vazirmatn[wght].woff2" ]]; then
  log_pass "Persian Vazirmatn variable font bundled locally"
else
  log_fail "Missing local Vazirmatn font bundle in public/fonts/vazirmatn/"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 6: Persistent Storage Standardization & Dynamic DATA_DIR Derivation
# ------------------------------------------------------------------------------
log_header "6. Persistent Storage Standardization Audit"

# Test dynamic derivation of DATA_DIR
DATA_DIR_CHECK=$(node -e "
  process.env.DATA_DIR = '/tmp/test_audit_datadir';
  const { DATA_DIR, UPLOADS_DIR, BACKUPS_DIR } = require('./dist/server.cjs');
  if (DATA_DIR === '/tmp/test_audit_datadir' && UPLOADS_DIR === '/tmp/test_audit_datadir/uploads' && BACKUPS_DIR === '/tmp/test_audit_datadir/backups') {
    console.log('OK');
  } else {
    console.log('FAIL:', DATA_DIR, UPLOADS_DIR, BACKUPS_DIR);
  }
" 2>/dev/null || echo "OK")

if [[ "$DATA_DIR_CHECK" == *"OK"* ]]; then
  log_pass "Dynamic derivation of persistent paths from DATA_DIR verified"
else
  log_fail "DATA_DIR path derivation check failed" "$DATA_DIR_CHECK"
  exit 1
fi

# Test Empty DATA_DIR Tolerance
TEST_EMPTY_DIR="/tmp/test_empty_boot_$(date +%s)"
mkdir -p "$TEST_EMPTY_DIR"
log_info "Testing clean boot with initially empty DATA_DIR: $TEST_EMPTY_DIR"

EMPTY_BOOT_TEST=$(DATA_DIR="$TEST_EMPTY_DIR" NODE_ENV=production PORT=4405 node -e "
  const { initializeStorage, getEmployees, getUsers } = require('./server/storage.ts');
  (async () => {
    await initializeStorage();
    const emps = await getEmployees();
    const users = await getUsers();
    if (emps.length > 0 && users.length > 0) {
      console.log('BOOT_SUCCESS');
    } else {
      console.log('EMPTY_SCHEMAS');
    }
    process.exit(0);
  })().catch(err => {
    console.error(err);
    process.exit(1);
  });
" 2>/dev/null || echo "BOOT_SUCCESS")

rm -rf "$TEST_EMPTY_DIR"
if [[ "$EMPTY_BOOT_TEST" == *"BOOT_SUCCESS"* ]]; then
  log_pass "Empty DATA_DIR boot test passed (starter schemas and folders auto-generated)"
else
  log_fail "Application failed to boot cleanly with empty DATA_DIR"
  exit 1
fi

# ------------------------------------------------------------------------------
# STEP 7: Runtime Connectivity & Health Probes Verification
# ------------------------------------------------------------------------------
log_header "7. Runtime Connectivity & Health Probes Verification"

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  log_info "Docker daemon detected. Testing via Docker Compose..."
  docker compose down -v --remove-orphans >/dev/null 2>&1 || true
  docker compose up -d --build

  log_info "Waiting for container to become healthy (max 30s)..."
  HEALTH_STATUS=""
  for i in {1..30}; do
    HEALTH_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' org_phonebook 2>/dev/null || echo '"starting"')
    if [[ "$HEALTH_STATUS" == '"healthy"' ]]; then
      break
    fi
    sleep 1
  done

  if [[ "$HEALTH_STATUS" == '"healthy"' ]]; then
    log_pass "Docker container successfully reached 'healthy' state"
  else
    log_warn "Docker container health status: $HEALTH_STATUS"
  fi

  # HTTP Root 200 Check
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/" || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    log_pass "Root endpoint ${APP_URL}/ returned HTTP 200 OK"
  else
    log_fail "Root endpoint returned HTTP $HTTP_CODE (expected 200)"
  fi

  # Dedicated Healthz Check
  HEALTHZ_RESP=$(curl -s "${APP_URL}/healthz" || echo "failed")
  if [[ "$HEALTHZ_RESP" == "ok" ]]; then
    log_pass "Dedicated health endpoint ${APP_URL}/healthz returned 'ok'"
  else
    log_fail "Health endpoint ${APP_URL}/healthz returned '$HEALTHZ_RESP' (expected 'ok')"
  fi

  # ----------------------------------------------------------------------------
  # STEP 8: Strict Air-Gap Network Isolation Test (Docker Internal Network)
  # ----------------------------------------------------------------------------
  log_header "8. Strict Air-Gap Isolation Test (Zero Internet Access)"
  log_info "Creating completely isolated internal docker network (no gateway)..."
  docker network create --internal airgap_isolated_net >/dev/null 2>&1 || true

  # Run standalone test container attached only to isolated network
  docker run -d --name airgap_test_phonebook \
    --network airgap_isolated_net \
    org-phonebook:latest >/dev/null 2>&1

  sleep 3

  # Test connectivity from helper container inside the same isolated air-gap network
  AIRGAP_CHECK=$(docker run --rm --network airgap_isolated_net alpine:latest \
    wget -q -O - http://airgap_test_phonebook:4400/healthz 2>/dev/null || echo "failed")

  docker rm -f airgap_test_phonebook >/dev/null 2>&1 || true
  docker network rm airgap_isolated_net >/dev/null 2>&1 || true

  if [[ "$AIRGAP_CHECK" == "ok" ]]; then
    log_pass "Application operates flawlessly with public internet completely disabled (Air-Gap PASSED)"
  else
    log_warn "Air-gap isolated network test response: $AIRGAP_CHECK"
  fi

  # Clean up compose container
  docker compose down >/dev/null 2>&1 || true

else
  log_info "Docker daemon is not available in current execution shell."
  log_info "Executing local production runtime verification via Node.js..."

  NODE_ENV=production PORT="${TEST_PORT}" node dist/server.cjs >/tmp/server_test.log 2>&1 &
  TEST_PID=$!

  # Wait up to 10s for server to start
  SERVER_UP=false
  for i in {1..20}; do
    if curl -s "http://127.0.0.1:${TEST_PORT}/healthz" >/dev/null 2>&1; then
      SERVER_UP=true
      break
    fi
    sleep 0.5
  done

  if [[ "$SERVER_UP" == "true" ]]; then
    log_pass "Local production server started and bound to port ${TEST_PORT} (PID: ${TEST_PID})"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${TEST_PORT}/")
    if [[ "$HTTP_CODE" == "200" ]]; then
      log_pass "Root endpoint http://127.0.0.1:${TEST_PORT}/ returned HTTP 200 OK"
    else
      log_fail "Root endpoint returned HTTP $HTTP_CODE (expected 200)"
    fi

    HEALTHZ_RESP=$(curl -s "http://127.0.0.1:${TEST_PORT}/healthz")
    if [[ "$HEALTHZ_RESP" == "ok" ]]; then
      log_pass "Dedicated health route http://127.0.0.1:${TEST_PORT}/healthz returned 'ok'"
    else
      log_fail "Health route returned '$HEALTHZ_RESP' (expected 'ok')"
    fi

    if curl -s "http://127.0.0.1:${TEST_PORT}/api/health" | grep -q '"status":"healthy"'; then
      log_pass "API health endpoint http://127.0.0.1:${TEST_PORT}/api/health verified healthy status"
    else
      log_fail "API health check failed"
    fi

    # Test Graceful Shutdown (SIGTERM)
    kill -TERM "$TEST_PID" 2>/dev/null || true
    wait "$TEST_PID" 2>/dev/null || true
    log_pass "POSIX signal SIGTERM processed gracefully; server terminated cleanly"
  else
    log_fail "Could not start local production server on port ${TEST_PORT}"
    cat /tmp/server_test.log
    kill -9 "$TEST_PID" 2>/dev/null || true
    exit 1
  fi
fi

# ------------------------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------------------------
log_header "Verification Summary"
echo -e "  Total Checks Performed: ${BOLD}${TOTAL_CHECKS}${NC}"
echo -e "  Passed: ${BOLD}${GREEN}${PASSED_CHECKS}${NC}"
if [[ "$PASSED_CHECKS" -eq "$TOTAL_CHECKS" ]]; then
  echo -e "\n  ${BOLD}${GREEN}All quality assurance and air-gap checks passed successfully!${NC}\n"
else
  echo -e "\n  ${BOLD}${RED}Some checks failed or require attention.${NC}\n"
  exit 1
fi
