#!/bin/bash
#
# health-check.sh - Comprehensive health check script for Revolucare platform
#
# This script performs health checks on all components of the Revolucare platform,
# including backend services, web frontend, database, Redis cache, and external integrations.
# It provides detailed status reporting and can be used for monitoring, alerting, and
# automated recovery.
#
# Usage:
#   ./health-check.sh [--environment=<dev|staging|prod>] [--api-url=<url>] [--web-url=<url>]
#                    [--db-host=<host>] [--redis-host=<host>] [--kubernetes-namespace=<namespace>]
#                    [--output=<json|text>] [--notify] [--auto-recover] [--verbose] [--help]
#
# Environment variables:
#   ENVIRONMENT - Deployment environment (dev, staging, prod)
#   API_URL - Base URL for the backend API
#   WEB_URL - Base URL for the web frontend
#   DB_HOST - PostgreSQL database host
#   DB_PORT - PostgreSQL database port
#   DB_NAME - PostgreSQL database name
#   DB_USER - PostgreSQL database user
#   DB_PASSWORD - PostgreSQL database password
#   REDIS_HOST - Redis cache host
#   REDIS_PORT - Redis cache port
#   REDIS_PASSWORD - Redis cache password
#   KUBERNETES_NAMESPACE - Kubernetes namespace for the application
#   SLACK_WEBHOOK_URL - Webhook URL for Slack notifications
#   EMAIL_RECIPIENT - Email address for health check reports
#   HEALTH_CHECK_TIMEOUT - Timeout in seconds for health checks
#

# Set strict mode
set -o errexit
set -o nounset
set -o pipefail

# Initialize globals
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG_FILE="${SCRIPT_DIR}/health-check.log"
ENVIRONMENT=${ENVIRONMENT:-"dev"}
API_URL=${API_URL:-"http://localhost:3000/api"}
WEB_URL=${WEB_URL:-"http://localhost:3000"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"revolucare"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-""}
REDIS_HOST=${REDIS_HOST:-"localhost"}
REDIS_PORT=${REDIS_PORT:-"6379"}
REDIS_PASSWORD=${REDIS_PASSWORD:-""}
KUBERNETES_NAMESPACE=${KUBERNETES_NAMESPACE:-"revolucare"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_RECIPIENT=${EMAIL_RECIPIENT:-""}
HEALTH_CHECK_TIMEOUT=${HEALTH_CHECK_TIMEOUT:-"10"}
OUTPUT_FORMAT="text"
VERBOSE=false
NOTIFY=false
AUTO_RECOVER=false

# Health check status codes
STATUS_OK=0
STATUS_WARNING=1
STATUS_CRITICAL=2
STATUS_DEPENDENCY_ERROR=3
STATUS_EXECUTION_ERROR=4

# Health check result storage
declare -A HEALTH_RESULTS

# Function to log messages to both stdout and log file
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Format log message
    local formatted_message="[${timestamp}] [${level}] ${message}"
    
    # Log to stdout
    if [[ "$level" == "ERROR" || "$level" == "CRITICAL" ]]; then
        echo -e "\e[31m${formatted_message}\e[0m" >&2
    elif [[ "$level" == "WARNING" ]]; then
        echo -e "\e[33m${formatted_message}\e[0m"
    elif [[ "$level" == "SUCCESS" ]]; then
        echo -e "\e[32m${formatted_message}\e[0m"
    elif [[ "$VERBOSE" == true || "$level" != "DEBUG" ]]; then
        echo "${formatted_message}"
    fi
    
    # Log to file
    echo "${formatted_message}" >> "${LOG_FILE}"
}

# Function to check if required dependencies are installed
check_dependencies() {
    log_message "Checking dependencies..." "DEBUG"
    
    local missing_deps=()
    
    # Check for required tools
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Optional check for kubectl
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        if ! command -v kubectl &> /dev/null; then
            missing_deps+=("kubectl")
        fi
    fi
    
    # Optional check for AWS CLI
    if [[ "$ENVIRONMENT" != "dev" ]]; then
        if ! command -v aws &> /dev/null; then
            missing_deps+=("aws-cli")
        fi
    fi
    
    # Optional check for PostgreSQL client
    if ! command -v psql &> /dev/null; then
        missing_deps+=("postgresql-client")
    fi
    
    # Optional check for Redis client
    if ! command -v redis-cli &> /dev/null; then
        missing_deps+=("redis-tools")
    fi
    
    # Check for missing dependencies
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        log_message "Missing dependencies: ${missing_deps[*]}" "ERROR"
        log_message "Please install required dependencies before running this script." "ERROR"
        return $STATUS_DEPENDENCY_ERROR
    fi
    
    log_message "All dependencies are installed." "DEBUG"
    return $STATUS_OK
}

# Function to check backend health
check_backend_health() {
    log_message "Checking backend API health..." "INFO"
    
    local health_endpoint="${API_URL}/health"
    local status="OK"
    local details=""
    local response=""
    
    # Send HTTP request to backend health endpoint
    response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${health_endpoint}" 2>&1)
    local curl_exit_code=$?
    
    # Check if curl command was successful
    if [[ $curl_exit_code -ne 0 ]]; then
        status="CRITICAL"
        details="Failed to connect to backend API: ${response}"
        log_message "${details}" "CRITICAL"
    else
        # Try to parse JSON response
        if echo "${response}" | jq -e . >/dev/null 2>&1; then
            # Extract status from response
            local api_status=$(echo "${response}" | jq -r '.status // "unknown"')
            local api_details=$(echo "${response}" | jq -r '.details // {}')
            
            if [[ "${api_status}" == "healthy" ]]; then
                status="OK"
                details="Backend API is healthy"
                log_message "${details}" "SUCCESS"
            elif [[ "${api_status}" == "degraded" ]]; then
                status="WARNING"
                details="Backend API is degraded: $(echo "${api_details}" | jq -c .)"
                log_message "${details}" "WARNING"
            else
                status="CRITICAL"
                details="Backend API is unhealthy: $(echo "${api_details}" | jq -c .)"
                log_message "${details}" "CRITICAL"
            fi
            
            # Check more specific health indicators from the response
            local db_status=$(echo "${response}" | jq -r '.components.database.status // "unknown"')
            local redis_status=$(echo "${response}" | jq -r '.components.redis.status // "unknown"')
            local external_status=$(echo "${response}" | jq -r '.components.externalServices.status // "unknown"')
            
            # Add component-specific details
            details="${details}\nDatabase: ${db_status}"
            details="${details}\nRedis: ${redis_status}"
            details="${details}\nExternal Services: ${external_status}"
        else
            status="CRITICAL"
            details="Invalid response from backend API health endpoint: ${response}"
            log_message "${details}" "CRITICAL"
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["backend"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check backend readiness
check_backend_readiness() {
    log_message "Checking backend API readiness..." "INFO"
    
    local readiness_endpoint="${API_URL}/health/ready"
    local status="OK"
    local details=""
    local response=""
    
    # Send HTTP request to backend readiness endpoint
    response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${readiness_endpoint}" 2>&1)
    local curl_exit_code=$?
    
    # Check if curl command was successful
    if [[ $curl_exit_code -ne 0 ]]; then
        status="CRITICAL"
        details="Failed to connect to backend API readiness endpoint: ${response}"
        log_message "${details}" "CRITICAL"
    else
        # Try to parse JSON response
        if echo "${response}" | jq -e . >/dev/null 2>&1; then
            # Extract status from response
            local api_status=$(echo "${response}" | jq -r '.status // "unknown"')
            local api_details=$(echo "${response}" | jq -r '.details // {}')
            
            if [[ "${api_status}" == "ready" ]]; then
                status="OK"
                details="Backend API is ready to serve requests"
                log_message "${details}" "SUCCESS"
            else
                status="CRITICAL"
                details="Backend API is not ready: $(echo "${api_details}" | jq -c .)"
                log_message "${details}" "CRITICAL"
            fi
            
            # Check if all required services are available
            local services_ready=$(echo "${response}" | jq -r '.components | to_entries | map(select(.value.status != "ready")) | length')
            if [[ "${services_ready}" -gt 0 ]]; then
                local unready_services=$(echo "${response}" | jq -r '.components | to_entries | map(select(.value.status != "ready")) | map(.key) | join(", ")')
                status="WARNING"
                details="${details}\nSome services are not ready: ${unready_services}"
                log_message "Some services are not ready: ${unready_services}" "WARNING"
            fi
        else
            status="CRITICAL"
            details="Invalid response from backend API readiness endpoint: ${response}"
            log_message "${details}" "CRITICAL"
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["backend_readiness"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check web frontend health
check_web_health() {
    log_message "Checking web frontend health..." "INFO"
    
    local status="OK"
    local details=""
    local response=""
    local start_time=$(date +%s.%N)
    
    # Send HTTP request to web frontend
    response=$(curl -s -o /dev/null -w "%{http_code},%{time_total}" -m "${HEALTH_CHECK_TIMEOUT}" "${WEB_URL}" 2>&1)
    local curl_exit_code=$?
    
    # Check if curl command was successful
    if [[ $curl_exit_code -ne 0 ]]; then
        status="CRITICAL"
        details="Failed to connect to web frontend: ${response}"
        log_message "${details}" "CRITICAL"
    else
        # Parse response
        IFS=',' read -r http_code time_total <<< "${response}"
        
        # Check HTTP status code
        if [[ "${http_code}" == "200" ]]; then
            details="Web frontend is accessible. Response time: ${time_total}s"
            
            # Check response time
            if (( $(echo "${time_total} > 2.0" | bc -l) )); then
                status="WARNING"
                details="${details} (slower than expected)"
                log_message "Web frontend is accessible but response time is slow: ${time_total}s" "WARNING"
            else
                log_message "Web frontend is healthy. Response time: ${time_total}s" "SUCCESS"
            fi
        else
            status="CRITICAL"
            details="Web frontend returned HTTP status ${http_code}"
            log_message "${details}" "CRITICAL"
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["web_frontend"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check database health
check_database_health() {
    log_message "Checking PostgreSQL database health..." "INFO"
    
    local status="OK"
    local details=""
    
    # Skip if PostgreSQL client is not available
    if ! command -v psql &> /dev/null; then
        status="WARNING"
        details="PostgreSQL client not available, skipping database health check"
        log_message "${details}" "WARNING"
        
        # Add result to health results
        HEALTH_RESULTS["database"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
        return $STATUS_WARNING
    fi
    
    # Check if DB_PASSWORD is set
    if [[ -z "${DB_PASSWORD}" ]]; then
        # Try connection without password
        if PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1" &>/dev/null; then
            log_message "Connected to database successfully" "SUCCESS"
        else
            status="CRITICAL"
            details="Failed to connect to database: authentication failed"
            log_message "${details}" "CRITICAL"
            
            # Add result to health results
            HEALTH_RESULTS["database"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
            return $STATUS_CRITICAL
        fi
    else
        # Try connection with password
        if PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1" &>/dev/null; then
            log_message "Connected to database successfully" "SUCCESS"
        else
            status="CRITICAL"
            details="Failed to connect to database: authentication failed"
            log_message "${details}" "CRITICAL"
            
            # Add result to health results
            HEALTH_RESULTS["database"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
            return $STATUS_CRITICAL
        fi
    fi
    
    # Check replication status for production environment
    if [[ "${ENVIRONMENT}" == "prod" ]]; then
        local replication_status=""
        
        if [[ -z "${DB_PASSWORD}" ]]; then
            replication_status=$(PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT * FROM pg_stat_replication" -t 2>/dev/null)
        else
            replication_status=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT * FROM pg_stat_replication" -t 2>/dev/null)
        fi
        
        if [[ -z "${replication_status}" ]]; then
            status="WARNING"
            details="Replication status: No replicas found"
            log_message "${details}" "WARNING"
        else
            details="Replication is active"
            log_message "${details}" "SUCCESS"
        fi
    fi
    
    # Check connection count against maximum connections
    local max_connections=""
    local current_connections=""
    
    if [[ -z "${DB_PASSWORD}" ]]; then
        max_connections=$(PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SHOW max_connections" -t 2>/dev/null | tr -d ' ')
        current_connections=$(PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_stat_activity" -t 2>/dev/null | tr -d ' ')
    else
        max_connections=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SHOW max_connections" -t 2>/dev/null | tr -d ' ')
        current_connections=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_stat_activity" -t 2>/dev/null | tr -d ' ')
    fi
    
    if [[ -n "${max_connections}" && -n "${current_connections}" ]]; then
        local connection_percentage=$((current_connections * 100 / max_connections))
        details="${details}\nConnections: ${current_connections}/${max_connections} (${connection_percentage}%)"
        
        if [[ ${connection_percentage} -gt 80 ]]; then
            status="WARNING"
            log_message "High database connection usage: ${connection_percentage}%" "WARNING"
        else
            log_message "Database connection usage: ${connection_percentage}%" "DEBUG"
        fi
    fi
    
    # Check for long-running queries
    local long_running_queries=""
    
    if [[ -z "${DB_PASSWORD}" ]]; then
        long_running_queries=$(PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND (now() - query_start) > interval '5 minutes'" -t 2>/dev/null | tr -d ' ')
    else
        long_running_queries=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND (now() - query_start) > interval '5 minutes'" -t 2>/dev/null | tr -d ' ')
    fi
    
    if [[ -n "${long_running_queries}" && "${long_running_queries}" -gt 0 ]]; then
        status="WARNING"
        details="${details}\nLong-running queries: ${long_running_queries}"
        log_message "Long-running queries detected: ${long_running_queries}" "WARNING"
    else
        details="${details}\nNo long-running queries detected"
    fi
    
    # Check for database locks
    local locks=""
    
    if [[ -z "${DB_PASSWORD}" ]]; then
        locks=$(PGPASSWORD="" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_locks l JOIN pg_stat_activity s ON l.pid = s.pid WHERE l.granted = false" -t 2>/dev/null | tr -d ' ')
    else
        locks=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) FROM pg_locks l JOIN pg_stat_activity s ON l.pid = s.pid WHERE l.granted = false" -t 2>/dev/null | tr -d ' ')
    fi
    
    if [[ -n "${locks}" && "${locks}" -gt 0 ]]; then
        status="WARNING"
        details="${details}\nPending locks: ${locks}"
        log_message "Database locks detected: ${locks}" "WARNING"
    else
        details="${details}\nNo pending locks detected"
    fi
    
    # Add result to health results
    HEALTH_RESULTS["database"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check Redis cache health
check_redis_health() {
    log_message "Checking Redis cache health..." "INFO"
    
    local status="OK"
    local details=""
    
    # Skip if Redis client is not available
    if ! command -v redis-cli &> /dev/null; then
        status="WARNING"
        details="Redis client not available, skipping Redis health check"
        log_message "${details}" "WARNING"
        
        # Add result to health results
        HEALTH_RESULTS["redis"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
        return $STATUS_WARNING
    fi
    
    # Build Redis CLI command
    local redis_cmd="redis-cli -h ${REDIS_HOST} -p ${REDIS_PORT}"
    if [[ -n "${REDIS_PASSWORD}" ]]; then
        redis_cmd="${redis_cmd} -a ${REDIS_PASSWORD}"
    fi
    
    # Check connectivity with PING command
    if ! ${redis_cmd} PING 2>/dev/null | grep -q "PONG"; then
        status="CRITICAL"
        details="Failed to connect to Redis: PING command failed"
        log_message "${details}" "CRITICAL"
        
        # Add result to health results
        HEALTH_RESULTS["redis"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
        return $STATUS_CRITICAL
    fi
    
    log_message "Connected to Redis successfully" "SUCCESS"
    
    # Check replication status for production environment
    if [[ "${ENVIRONMENT}" == "prod" ]]; then
        local replication_info=$(${redis_cmd} INFO replication 2>/dev/null)
        
        if echo "${replication_info}" | grep -q "role:master"; then
            local connected_slaves=$(echo "${replication_info}" | grep "connected_slaves:" | cut -d ":" -f 2)
            if [[ "${connected_slaves}" -eq 0 ]]; then
                status="WARNING"
                details="Replication status: Master with no connected slaves"
                log_message "${details}" "WARNING"
            else
                details="Replication status: Master with ${connected_slaves} connected slaves"
                log_message "${details}" "SUCCESS"
            fi
        elif echo "${replication_info}" | grep -q "role:slave"; then
            local master_link_status=$(echo "${replication_info}" | grep "master_link_status:" | cut -d ":" -f 2 | tr -d "\r\n")
            if [[ "${master_link_status}" != "up" ]]; then
                status="CRITICAL"
                details="Replication status: Slave with broken link to master"
                log_message "${details}" "CRITICAL"
            else
                details="Replication status: Slave with link to master up"
                log_message "${details}" "SUCCESS"
            fi
        fi
    fi
    
    # Check memory usage
    local memory_info=$(${redis_cmd} INFO memory 2>/dev/null)
    local used_memory=$(echo "${memory_info}" | grep "used_memory_human:" | cut -d ":" -f 2 | tr -d "\r\n")
    local maxmemory=$(echo "${memory_info}" | grep "maxmemory_human:" | cut -d ":" -f 2 | tr -d "\r\n")
    
    details="${details}\nMemory usage: ${used_memory}"
    if [[ "${maxmemory}" != "0B" ]]; then
        details="${details} / ${maxmemory}"
        
        # Parse values to bytes for comparison
        local used_memory_bytes=$(echo "${memory_info}" | grep "used_memory:" | cut -d ":" -f 2 | tr -d "\r\n")
        local maxmemory_bytes=$(echo "${memory_info}" | grep "maxmemory:" | cut -d ":" -f 2 | tr -d "\r\n")
        
        if [[ "${maxmemory_bytes}" != "0" ]]; then
            local memory_percentage=$((used_memory_bytes * 100 / maxmemory_bytes))
            details="${details} (${memory_percentage}%)"
            
            if [[ ${memory_percentage} -gt 80 ]]; then
                status="WARNING"
                log_message "High Redis memory usage: ${memory_percentage}%" "WARNING"
            else
                log_message "Redis memory usage: ${memory_percentage}%" "DEBUG"
            fi
        fi
    fi
    
    # Check for blocked clients
    local clients_info=$(${redis_cmd} INFO clients 2>/dev/null)
    local blocked_clients=$(echo "${clients_info}" | grep "blocked_clients:" | cut -d ":" -f 2 | tr -d "\r\n")
    
    if [[ "${blocked_clients}" -gt 0 ]]; then
        status="WARNING"
        details="${details}\nBlocked clients: ${blocked_clients}"
        log_message "Redis blocked clients: ${blocked_clients}" "WARNING"
    else
        details="${details}\nNo blocked clients"
    fi
    
    # Check hit/miss ratio for cache effectiveness
    local stats_info=$(${redis_cmd} INFO stats 2>/dev/null)
    local keyspace_hits=$(echo "${stats_info}" | grep "keyspace_hits:" | cut -d ":" -f 2 | tr -d "\r\n")
    local keyspace_misses=$(echo "${stats_info}" | grep "keyspace_misses:" | cut -d ":" -f 2 | tr -d "\r\n")
    
    if [[ "${keyspace_hits}" != "0" || "${keyspace_misses}" != "0" ]]; then
        local total_ops=$((keyspace_hits + keyspace_misses))
        if [[ "${total_ops}" -gt 0 ]]; then
            local hit_ratio=$((keyspace_hits * 100 / total_ops))
            details="${details}\nCache hit ratio: ${hit_ratio}% (${keyspace_hits} hits, ${keyspace_misses} misses)"
            
            if [[ ${hit_ratio} -lt 50 ]]; then
                status="WARNING"
                log_message "Low Redis cache hit ratio: ${hit_ratio}%" "WARNING"
            else
                log_message "Redis cache hit ratio: ${hit_ratio}%" "DEBUG"
            fi
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["redis"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check Kubernetes resources
check_kubernetes_resources() {
    log_message "Checking Kubernetes resources..." "INFO"
    
    local status="OK"
    local details=""
    
    # Skip if kubectl is not available
    if ! command -v kubectl &> /dev/null; then
        status="WARNING"
        details="kubectl not available, skipping Kubernetes resources health check"
        log_message "${details}" "WARNING"
        
        # Add result to health results
        HEALTH_RESULTS["kubernetes"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
        return $STATUS_WARNING
    fi
    
    # Check if we're in a Kubernetes environment
    if [[ "${ENVIRONMENT}" == "dev" ]]; then
        status="OK"
        details="Development environment, skipping Kubernetes resources health check"
        log_message "${details}" "DEBUG"
        
        # Add result to health results
        HEALTH_RESULTS["kubernetes"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
        return $STATUS_OK
    fi
    
    # Check pod status for backend deployment
    local backend_pods=$(kubectl get pods -n "${KUBERNETES_NAMESPACE}" -l app=revolucare-backend -o json 2>/dev/null)
    
    # Check if command was successful
    if [[ $? -ne 0 ]]; then
        status="WARNING"
        details="Failed to get backend pods information"
        log_message "${details}" "WARNING"
    else
        local backend_pod_count=$(echo "${backend_pods}" | jq '.items | length')
        local backend_running_count=$(echo "${backend_pods}" | jq '[.items[] | select(.status.phase == "Running")] | length')
        local backend_pending_count=$(echo "${backend_pods}" | jq '[.items[] | select(.status.phase == "Pending")] | length')
        local backend_failed_count=$(echo "${backend_pods}" | jq '[.items[] | select(.status.phase == "Failed")] | length')
        local backend_crashloop_count=$(echo "${backend_pods}" | jq '[.items[] | select(.status.containerStatuses[].state.waiting.reason == "CrashLoopBackOff")] | length')
        
        details="Backend pods: ${backend_running_count}/${backend_pod_count} running"
        
        if [[ "${backend_running_count}" -lt "${backend_pod_count}" ]]; then
            status="WARNING"
            details="${details}, ${backend_pending_count} pending, ${backend_failed_count} failed, ${backend_crashloop_count} crashlooping"
            log_message "Not all backend pods are running: ${backend_running_count}/${backend_pod_count}" "WARNING"
        else
            log_message "All backend pods are running: ${backend_running_count}/${backend_pod_count}" "SUCCESS"
        fi
        
        if [[ "${backend_crashloop_count}" -gt 0 ]]; then
            status="CRITICAL"
            log_message "Backend pods in CrashLoopBackOff: ${backend_crashloop_count}" "CRITICAL"
        fi
    fi
    
    # Check pod status for web deployment
    local web_pods=$(kubectl get pods -n "${KUBERNETES_NAMESPACE}" -l app=revolucare-web -o json 2>/dev/null)
    
    # Check if command was successful
    if [[ $? -ne 0 ]]; then
        status="WARNING"
        details="${details}\nFailed to get web pods information"
        log_message "Failed to get web pods information" "WARNING"
    else
        local web_pod_count=$(echo "${web_pods}" | jq '.items | length')
        local web_running_count=$(echo "${web_pods}" | jq '[.items[] | select(.status.phase == "Running")] | length')
        local web_pending_count=$(echo "${web_pods}" | jq '[.items[] | select(.status.phase == "Pending")] | length')
        local web_failed_count=$(echo "${web_pods}" | jq '[.items[] | select(.status.phase == "Failed")] | length')
        local web_crashloop_count=$(echo "${web_pods}" | jq '[.items[] | select(.status.containerStatuses[].state.waiting.reason == "CrashLoopBackOff")] | length')
        
        details="${details}\nWeb pods: ${web_running_count}/${web_pod_count} running"
        
        if [[ "${web_running_count}" -lt "${web_pod_count}" ]]; then
            status="WARNING"
            details="${details}, ${web_pending_count} pending, ${web_failed_count} failed, ${web_crashloop_count} crashlooping"
            log_message "Not all web pods are running: ${web_running_count}/${web_pod_count}" "WARNING"
        else
            log_message "All web pods are running: ${web_running_count}/${web_pod_count}" "SUCCESS"
        fi
        
        if [[ "${web_crashloop_count}" -gt 0 ]]; then
            status="CRITICAL"
            log_message "Web pods in CrashLoopBackOff: ${web_crashloop_count}" "CRITICAL"
        fi
    fi
    
    # Check resource utilization
    local nodes=$(kubectl get nodes -o json 2>/dev/null)
    
    # Check if command was successful
    if [[ $? -ne 0 ]]; then
        status="WARNING"
        details="${details}\nFailed to get nodes information"
        log_message "Failed to get nodes information" "WARNING"
    else
        local node_count=$(echo "${nodes}" | jq '.items | length')
        local ready_nodes=$(echo "${nodes}" | jq '[.items[] | select(.status.conditions[] | select(.type == "Ready" and .status == "True"))] | length')
        
        details="${details}\nNodes: ${ready_nodes}/${node_count} ready"
        
        if [[ "${ready_nodes}" -lt "${node_count}" ]]; then
            status="WARNING"
            log_message "Not all nodes are ready: ${ready_nodes}/${node_count}" "WARNING"
        else
            log_message "All nodes are ready: ${ready_nodes}/${node_count}" "SUCCESS"
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["kubernetes"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check external services
check_external_services() {
    log_message "Checking external service integrations..." "INFO"
    
    local status="OK"
    local details=""
    
    # Check OpenAI API
    local openai_health_endpoint="${API_URL}/health/external/openai"
    local openai_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${openai_health_endpoint}" 2>&1)
    local openai_curl_exit_code=$?
    
    if [[ $openai_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="OpenAI API: Failed to check status"
        log_message "Failed to check OpenAI API status: ${openai_response}" "WARNING"
    else
        if echo "${openai_response}" | jq -e . >/dev/null 2>&1; then
            local openai_status=$(echo "${openai_response}" | jq -r '.status // "unknown"')
            
            if [[ "${openai_status}" == "operational" ]]; then
                details="OpenAI API: Operational"
                log_message "OpenAI API is operational" "SUCCESS"
            else
                status="WARNING"
                details="OpenAI API: ${openai_status}"
                log_message "OpenAI API status: ${openai_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="OpenAI API: Invalid response"
            log_message "Invalid response from OpenAI API health check" "WARNING"
        fi
    fi
    
    # Check Azure Form Recognizer
    local azure_health_endpoint="${API_URL}/health/external/azure-form-recognizer"
    local azure_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${azure_health_endpoint}" 2>&1)
    local azure_curl_exit_code=$?
    
    if [[ $azure_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="${details}\nAzure Form Recognizer: Failed to check status"
        log_message "Failed to check Azure Form Recognizer status: ${azure_response}" "WARNING"
    else
        if echo "${azure_response}" | jq -e . >/dev/null 2>&1; then
            local azure_status=$(echo "${azure_response}" | jq -r '.status // "unknown"')
            
            if [[ "${azure_status}" == "operational" ]]; then
                details="${details}\nAzure Form Recognizer: Operational"
                log_message "Azure Form Recognizer is operational" "SUCCESS"
            else
                status="WARNING"
                details="${details}\nAzure Form Recognizer: ${azure_status}"
                log_message "Azure Form Recognizer status: ${azure_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="${details}\nAzure Form Recognizer: Invalid response"
            log_message "Invalid response from Azure Form Recognizer health check" "WARNING"
        fi
    fi
    
    # Check Stripe API
    local stripe_health_endpoint="${API_URL}/health/external/stripe"
    local stripe_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${stripe_health_endpoint}" 2>&1)
    local stripe_curl_exit_code=$?
    
    if [[ $stripe_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="${details}\nStripe API: Failed to check status"
        log_message "Failed to check Stripe API status: ${stripe_response}" "WARNING"
    else
        if echo "${stripe_response}" | jq -e . >/dev/null 2>&1; then
            local stripe_status=$(echo "${stripe_response}" | jq -r '.status // "unknown"')
            
            if [[ "${stripe_status}" == "operational" ]]; then
                details="${details}\nStripe API: Operational"
                log_message "Stripe API is operational" "SUCCESS"
            else
                status="WARNING"
                details="${details}\nStripe API: ${stripe_status}"
                log_message "Stripe API status: ${stripe_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="${details}\nStripe API: Invalid response"
            log_message "Invalid response from Stripe API health check" "WARNING"
        fi
    fi
    
    # Check SendGrid
    local sendgrid_health_endpoint="${API_URL}/health/external/sendgrid"
    local sendgrid_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${sendgrid_health_endpoint}" 2>&1)
    local sendgrid_curl_exit_code=$?
    
    if [[ $sendgrid_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="${details}\nSendGrid: Failed to check status"
        log_message "Failed to check SendGrid status: ${sendgrid_response}" "WARNING"
    else
        if echo "${sendgrid_response}" | jq -e . >/dev/null 2>&1; then
            local sendgrid_status=$(echo "${sendgrid_response}" | jq -r '.status // "unknown"')
            
            if [[ "${sendgrid_status}" == "operational" ]]; then
                details="${details}\nSendGrid: Operational"
                log_message "SendGrid is operational" "SUCCESS"
            else
                status="WARNING"
                details="${details}\nSendGrid: ${sendgrid_status}"
                log_message "SendGrid status: ${sendgrid_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="${details}\nSendGrid: Invalid response"
            log_message "Invalid response from SendGrid health check" "WARNING"
        fi
    fi
    
    # Check Twilio
    local twilio_health_endpoint="${API_URL}/health/external/twilio"
    local twilio_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${twilio_health_endpoint}" 2>&1)
    local twilio_curl_exit_code=$?
    
    if [[ $twilio_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="${details}\nTwilio: Failed to check status"
        log_message "Failed to check Twilio status: ${twilio_response}" "WARNING"
    else
        if echo "${twilio_response}" | jq -e . >/dev/null 2>&1; then
            local twilio_status=$(echo "${twilio_response}" | jq -r '.status // "unknown"')
            
            if [[ "${twilio_status}" == "operational" ]]; then
                details="${details}\nTwilio: Operational"
                log_message "Twilio is operational" "SUCCESS"
            else
                status="WARNING"
                details="${details}\nTwilio: ${twilio_status}"
                log_message "Twilio status: ${twilio_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="${details}\nTwilio: Invalid response"
            log_message "Invalid response from Twilio health check" "WARNING"
        fi
    fi
    
    # Check Google Maps API
    local maps_health_endpoint="${API_URL}/health/external/google-maps"
    local maps_response=$(curl -s -X GET -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${maps_health_endpoint}" 2>&1)
    local maps_curl_exit_code=$?
    
    if [[ $maps_curl_exit_code -ne 0 ]]; then
        status="WARNING"
        details="${details}\nGoogle Maps API: Failed to check status"
        log_message "Failed to check Google Maps API status: ${maps_response}" "WARNING"
    else
        if echo "${maps_response}" | jq -e . >/dev/null 2>&1; then
            local maps_status=$(echo "${maps_response}" | jq -r '.status // "unknown"')
            
            if [[ "${maps_status}" == "operational" ]]; then
                details="${details}\nGoogle Maps API: Operational"
                log_message "Google Maps API is operational" "SUCCESS"
            else
                status="WARNING"
                details="${details}\nGoogle Maps API: ${maps_status}"
                log_message "Google Maps API status: ${maps_status}" "WARNING"
            fi
        else
            status="WARNING"
            details="${details}\nGoogle Maps API: Invalid response"
            log_message "Invalid response from Google Maps API health check" "WARNING"
        fi
    fi
    
    # Add result to health results
    HEALTH_RESULTS["external_services"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to check storage health
check_storage_health() {
    log_message "Checking storage health..." "INFO"
    
    local status="OK"
    local details=""
    
    # Check S3 bucket accessibility
    if command -v aws &> /dev/null; then
        if [[ "${ENVIRONMENT}" != "dev" ]]; then
            local s3_bucket="revolucare-${ENVIRONMENT}"
            local s3_response=$(aws s3 ls "s3://${s3_bucket}" --max-items 1 2>&1)
            local aws_exit_code=$?
            
            if [[ $aws_exit_code -ne 0 ]]; then
                status="CRITICAL"
                details="S3 bucket accessibility: Failed"
                log_message "Failed to access S3 bucket: ${s3_response}" "CRITICAL"
            else
                details="S3 bucket accessibility: Success"
                log_message "S3 bucket is accessible" "SUCCESS"
                
                # Check write permissions with a small test file
                local timestamp=$(date +%s)
                local test_file="/tmp/s3_write_test_${timestamp}.txt"
                echo "S3 write test at ${timestamp}" > "${test_file}"
                
                local s3_write_response=$(aws s3 cp "${test_file}" "s3://${s3_bucket}/health-check/write-test-${timestamp}.txt" 2>&1)
                local aws_write_exit_code=$?
                
                rm -f "${test_file}"
                
                if [[ $aws_write_exit_code -ne 0 ]]; then
                    status="WARNING"
                    details="${details}\nS3 write permissions: Failed"
                    log_message "Failed to write to S3 bucket: ${s3_write_response}" "WARNING"
                else
                    details="${details}\nS3 write permissions: Success"
                    log_message "S3 write permissions are OK" "SUCCESS"
                    
                    # Clean up the test file from S3
                    aws s3 rm "s3://${s3_bucket}/health-check/write-test-${timestamp}.txt" &>/dev/null
                fi
            fi
        else
            details="Development environment, skipping S3 bucket checks"
            log_message "${details}" "DEBUG"
        fi
    else
        status="WARNING"
        details="AWS CLI not available, skipping S3 bucket checks"
        log_message "${details}" "WARNING"
    fi
    
    # Add result to health results
    HEALTH_RESULTS["storage"]="{ \"status\": \"${status}\", \"details\": \"${details}\" }"
    
    # Return appropriate status code
    if [[ "${status}" == "OK" ]]; then
        return $STATUS_OK
    elif [[ "${status}" == "WARNING" ]]; then
        return $STATUS_WARNING
    else
        return $STATUS_CRITICAL
    fi
}

# Function to generate health report
generate_health_report() {
    log_message "Generating health report..." "DEBUG"
    
    local overall_status="OK"
    local report=""
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    # Initialize report
    report="========================================\n"
    report="${report}REVOLUCARE PLATFORM HEALTH REPORT\n"
    report="${report}========================================\n"
    report="${report}Timestamp: ${timestamp}\n"
    report="${report}Environment: ${ENVIRONMENT}\n"
    report="${report}========================================\n\n"
    
    # Calculate overall health status
    for component in "${!HEALTH_RESULTS[@]}"; do
        local component_status=$(echo "${HEALTH_RESULTS[$component]}" | jq -r '.status')
        
        if [[ "${component_status}" == "CRITICAL" ]]; then
            overall_status="CRITICAL"
        elif [[ "${component_status}" == "WARNING" && "${overall_status}" != "CRITICAL" ]]; then
            overall_status="WARNING"
        fi
    done
    
    # Add overall status to report
    report="${report}OVERALL STATUS: ${overall_status}\n\n"
    
    # Add component details to report
    report="${report}COMPONENT DETAILS:\n"
    report="${report}========================================\n"
    
    # Backend API
    if [[ -n "${HEALTH_RESULTS[backend]}" ]]; then
        local backend_status=$(echo "${HEALTH_RESULTS[backend]}" | jq -r '.status')
        local backend_details=$(echo "${HEALTH_RESULTS[backend]}" | jq -r '.details')
        
        report="${report}Backend API: ${backend_status}\n"
        report="${report}${backend_details}\n\n"
    fi
    
    # Backend Readiness
    if [[ -n "${HEALTH_RESULTS[backend_readiness]}" ]]; then
        local readiness_status=$(echo "${HEALTH_RESULTS[backend_readiness]}" | jq -r '.status')
        local readiness_details=$(echo "${HEALTH_RESULTS[backend_readiness]}" | jq -r '.details')
        
        report="${report}Backend Readiness: ${readiness_status}\n"
        report="${report}${readiness_details}\n\n"
    fi
    
    # Web Frontend
    if [[ -n "${HEALTH_RESULTS[web_frontend]}" ]]; then
        local web_status=$(echo "${HEALTH_RESULTS[web_frontend]}" | jq -r '.status')
        local web_details=$(echo "${HEALTH_RESULTS[web_frontend]}" | jq -r '.details')
        
        report="${report}Web Frontend: ${web_status}\n"
        report="${report}${web_details}\n\n"
    fi
    
    # Database
    if [[ -n "${HEALTH_RESULTS[database]}" ]]; then
        local db_status=$(echo "${HEALTH_RESULTS[database]}" | jq -r '.status')
        local db_details=$(echo "${HEALTH_RESULTS[database]}" | jq -r '.details')
        
        report="${report}Database: ${db_status}\n"
        report="${report}${db_details}\n\n"
    fi
    
    # Redis
    if [[ -n "${HEALTH_RESULTS[redis]}" ]]; then
        local redis_status=$(echo "${HEALTH_RESULTS[redis]}" | jq -r '.status')
        local redis_details=$(echo "${HEALTH_RESULTS[redis]}" | jq -r '.details')
        
        report="${report}Redis Cache: ${redis_status}\n"
        report="${report}${redis_details}\n\n"
    fi
    
    # Kubernetes
    if [[ -n "${HEALTH_RESULTS[kubernetes]}" ]]; then
        local k8s_status=$(echo "${HEALTH_RESULTS[kubernetes]}" | jq -r '.status')
        local k8s_details=$(echo "${HEALTH_RESULTS[kubernetes]}" | jq -r '.details')
        
        report="${report}Kubernetes Resources: ${k8s_status}\n"
        report="${report}${k8s_details}\n\n"
    fi
    
    # External Services
    if [[ -n "${HEALTH_RESULTS[external_services]}" ]]; then
        local ext_status=$(echo "${HEALTH_RESULTS[external_services]}" | jq -r '.status')
        local ext_details=$(echo "${HEALTH_RESULTS[external_services]}" | jq -r '.details')
        
        report="${report}External Services: ${ext_status}\n"
        report="${report}${ext_details}\n\n"
    fi
    
    # Storage
    if [[ -n "${HEALTH_RESULTS[storage]}" ]]; then
        local storage_status=$(echo "${HEALTH_RESULTS[storage]}" | jq -r '.status')
        local storage_details=$(echo "${HEALTH_RESULTS[storage]}" | jq -r '.details')
        
        report="${report}Storage: ${storage_status}\n"
        report="${report}${storage_details}\n\n"
    fi
    
    # Add recommendations if issues found
    if [[ "${overall_status}" != "OK" ]]; then
        report="${report}RECOMMENDATIONS:\n"
        report="${report}========================================\n"
        
        # Check for critical components
        if echo "${HEALTH_RESULTS[backend]}" | jq -r '.status' | grep -q "CRITICAL"; then
            report="${report}* Investigate backend API issues immediately. Check logs for details.\n"
        fi
        
        if echo "${HEALTH_RESULTS[database]}" | jq -r '.status' | grep -q "CRITICAL"; then
            report="${report}* Database is in critical state. Check connection parameters and database logs.\n"
        fi
        
        if echo "${HEALTH_RESULTS[redis]}" | jq -r '.status' | grep -q "CRITICAL"; then
            report="${report}* Redis cache is in critical state. Check Redis logs and configuration.\n"
        fi
        
        if echo "${HEALTH_RESULTS[kubernetes]}" | jq -r '.status' | grep -q "CRITICAL"; then
            report="${report}* Kubernetes resources have critical issues. Check for crashlooping pods.\n"
        fi
        
        if echo "${HEALTH_RESULTS[storage]}" | jq -r '.status' | grep -q "CRITICAL"; then
            report="${report}* Storage is in critical state. Check S3 bucket permissions and connectivity.\n"
        fi
        
        # Check for warning components
        if echo "${HEALTH_RESULTS[backend]}" | jq -r '.status' | grep -q "WARNING"; then
            report="${report}* Backend API has warnings. Review backend logs for details.\n"
        fi
        
        if echo "${HEALTH_RESULTS[database]}" | jq -r '.status' | grep -q "WARNING"; then
            report="${report}* Database has warnings. Check for long-running queries and connection count.\n"
        fi
        
        if echo "${HEALTH_RESULTS[redis]}" | jq -r '.status' | grep -q "WARNING"; then
            report="${report}* Redis cache has warnings. Review memory usage and blocked clients.\n"
        fi
        
        if echo "${HEALTH_RESULTS[kubernetes]}" | jq -r '.status' | grep -q "WARNING"; then
            report="${report}* Kubernetes resources have warnings. Check for pending pods and node status.\n"
        fi
        
        if echo "${HEALTH_RESULTS[external_services]}" | jq -r '.status' | grep -q "WARNING"; then
            report="${report}* Some external services have issues. Review external service connectivity.\n"
        fi
    fi
    
    # Return the report
    echo -e "${report}"
}

# Function to send notifications for health check issues
send_notifications() {
    local health_results=$1
    local report_text=$2
    
    log_message "Checking if notifications need to be sent..." "DEBUG"
    
    # Check if any component has critical or warning status
    local send_notification=false
    local notification_level="INFO"
    
    for component in "${!HEALTH_RESULTS[@]}"; do
        local component_status=$(echo "${HEALTH_RESULTS[$component]}" | jq -r '.status')
        
        if [[ "${component_status}" == "CRITICAL" ]]; then
            send_notification=true
            notification_level="CRITICAL"
            break
        elif [[ "${component_status}" == "WARNING" ]]; then
            send_notification=true
            notification_level="WARNING"
        fi
    done
    
    # Skip if no issues or notifications not enabled
    if [[ "${send_notification}" == false || "${NOTIFY}" == false ]]; then
        log_message "No notifications to send" "DEBUG"
        return 0
    fi
    
    log_message "Sending notifications for health check issues..." "INFO"
    
    # Format notification message
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    local notification_title="Revolucare Health Alert: ${notification_level} - ${ENVIRONMENT}"
    local notification_message="Health check at ${timestamp} detected ${notification_level} issues.\n\n"
    
    # Add key issues to notification
    for component in "${!HEALTH_RESULTS[@]}"; do
        local component_status=$(echo "${HEALTH_RESULTS[$component]}" | jq -r '.status')
        
        if [[ "${component_status}" == "CRITICAL" || "${component_status}" == "WARNING" ]]; then
            local component_details=$(echo "${HEALTH_RESULTS[$component]}" | jq -r '.details' | head -n 1)
            notification_message="${notification_message}${component}: ${component_status} - ${component_details}\n"
        fi
    done
    
    # Send Slack notification if webhook URL is configured
    if [[ -n "${SLACK_WEBHOOK_URL}" ]]; then
        log_message "Sending Slack notification..." "DEBUG"
        
        local slack_color="good"
        if [[ "${notification_level}" == "WARNING" ]]; then
            slack_color="warning"
        elif [[ "${notification_level}" == "CRITICAL" ]]; then
            slack_color="danger"
        fi
        
        local slack_payload="{\"attachments\":[{\"color\":\"${slack_color}\",\"title\":\"${notification_title}\",\"text\":\"${notification_message}\",\"mrkdwn_in\":[\"text\"]}]}"
        
        local slack_response=$(curl -s -X POST -H "Content-Type: application/json" -d "${slack_payload}" "${SLACK_WEBHOOK_URL}" 2>&1)
        
        if [[ "${slack_response}" == "ok" ]]; then
            log_message "Slack notification sent successfully" "SUCCESS"
        else
            log_message "Failed to send Slack notification: ${slack_response}" "ERROR"
        fi
    fi
    
    # Send email notification if recipient is configured
    if [[ -n "${EMAIL_RECIPIENT}" ]]; then
        log_message "Sending email notification..." "DEBUG"
        
        # This is a simplified email sending using mail command
        # In a production environment, consider using a more robust solution
        if command -v mail &> /dev/null; then
            echo -e "${report_text}" | mail -s "${notification_title}" "${EMAIL_RECIPIENT}"
            log_message "Email notification sent to ${EMAIL_RECIPIENT}" "SUCCESS"
        else
            log_message "mail command not available, skipping email notification" "WARNING"
        fi
    fi
    
    return 0
}

# Function to attempt recovery from detected issues
attempt_recovery() {
    local health_results=$1
    
    # Skip if auto-recovery not enabled
    if [[ "${AUTO_RECOVER}" != true ]]; then
        log_message "Auto-recovery not enabled, skipping..." "DEBUG"
        return 0
    fi
    
    log_message "Attempting recovery from detected issues..." "INFO"
    
    local recovery_actions=()
    
    # Check for backend API issues
    if echo "${HEALTH_RESULTS[backend]}" | jq -r '.status' | grep -q "CRITICAL"; then
        log_message "Attempting to recover backend API..." "INFO"
        
        # Check if we have kubectl access for pod restart
        if command -v kubectl &> /dev/null && [[ "${ENVIRONMENT}" != "dev" ]]; then
            # Get backend pods and look for unhealthy ones
            local backend_pods=$(kubectl get pods -n "${KUBERNETES_NAMESPACE}" -l app=revolucare-backend -o json 2>/dev/null)
            
            if [[ $? -eq 0 ]]; then
                local unhealthy_pods=$(echo "${backend_pods}" | jq -r '.items[] | select(.status.phase != "Running" or (.status.containerStatuses[] | select(.ready == false))) | .metadata.name')
                
                if [[ -n "${unhealthy_pods}" ]]; then
                    for pod in ${unhealthy_pods}; do
                        log_message "Restarting unhealthy pod: ${pod}" "WARNING"
                        kubectl delete pod -n "${KUBERNETES_NAMESPACE}" "${pod}" &>/dev/null
                        
                        if [[ $? -eq 0 ]]; then
                            recovery_actions+=("Restarted unhealthy backend pod: ${pod}")
                            log_message "Successfully restarted pod: ${pod}" "SUCCESS"
                        else
                            log_message "Failed to restart pod: ${pod}" "ERROR"
                        fi
                    done
                else
                    log_message "No unhealthy backend pods found" "DEBUG"
                fi
            fi
        else
            log_message "kubectl not available, cannot restart pods" "WARNING"
        fi
    fi
    
    # Check for database connection issues
    if echo "${HEALTH_RESULTS[database]}" | jq -r '.status' | grep -q "CRITICAL"; then
        log_message "Attempting to recover database connection..." "INFO"
        
        # For database issues, we can try to call a DB connection reset endpoint
        local db_reset_endpoint="${API_URL}/health/reset-db-connection"
        local db_reset_response=$(curl -s -X POST -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${db_reset_endpoint}" 2>&1)
        
        if echo "${db_reset_response}" | jq -e . >/dev/null 2>&1; then
            local reset_status=$(echo "${db_reset_response}" | jq -r '.status // "unknown"')
            
            if [[ "${reset_status}" == "success" ]]; then
                recovery_actions+=("Reset database connection pool")
                log_message "Successfully reset database connection pool" "SUCCESS"
            else
                log_message "Failed to reset database connection pool: ${reset_status}" "ERROR"
            fi
        else
            log_message "Invalid response from database connection reset endpoint" "ERROR"
        fi
    fi
    
    # Check for Redis issues
    if echo "${HEALTH_RESULTS[redis]}" | jq -r '.status' | grep -q "CRITICAL"; then
        log_message "Attempting to recover Redis connection..." "INFO"
        
        # For Redis issues, we can try to call a Redis connection reset endpoint
        local redis_reset_endpoint="${API_URL}/health/reset-redis-connection"
        local redis_reset_response=$(curl -s -X POST -H "Content-Type: application/json" -m "${HEALTH_CHECK_TIMEOUT}" "${redis_reset_endpoint}" 2>&1)
        
        if echo "${redis_reset_response}" | jq -e . >/dev/null 2>&1; then
            local reset_status=$(echo "${redis_reset_response}" | jq -r '.status // "unknown"')
            
            if [[ "${reset_status}" == "success" ]]; then
                recovery_actions+=("Reset Redis connection")
                log_message "Successfully reset Redis connection" "SUCCESS"
            else
                log_message "Failed to reset Redis connection: ${reset_status}" "ERROR"
            fi
        else
            log_message "Invalid response from Redis connection reset endpoint" "ERROR"
        fi
    fi
    
    # Log recovery summary
    if [[ ${#recovery_actions[@]} -gt 0 ]]; then
        log_message "Recovery actions taken:" "INFO"
        for action in "${recovery_actions[@]}"; do
            log_message "- ${action}" "INFO"
        done
    else
        log_message "No recovery actions taken" "INFO"
    fi
    
    return 0
}

# Parse command-line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment=*)
                ENVIRONMENT="${1#*=}"
                shift
                ;;
            --api-url=*)
                API_URL="${1#*=}"
                shift
                ;;
            --web-url=*)
                WEB_URL="${1#*=}"
                shift
                ;;
            --db-host=*)
                DB_HOST="${1#*=}"
                shift
                ;;
            --redis-host=*)
                REDIS_HOST="${1#*=}"
                shift
                ;;
            --kubernetes-namespace=*)
                KUBERNETES_NAMESPACE="${1#*=}"
                shift
                ;;
            --output=*)
                OUTPUT_FORMAT="${1#*=}"
                shift
                ;;
            --notify)
                NOTIFY=true
                shift
                ;;
            --auto-recover)
                AUTO_RECOVER=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --environment=<dev|staging|prod>  Deployment environment"
                echo "  --api-url=<url>                   Base URL for the backend API"
                echo "  --web-url=<url>                   Base URL for the web frontend"
                echo "  --db-host=<host>                  PostgreSQL database host"
                echo "  --redis-host=<host>               Redis cache host"
                echo "  --kubernetes-namespace=<ns>       Kubernetes namespace for the application"
                echo "  --output=<json|text>              Output format"
                echo "  --notify                          Send notifications on issues"
                echo "  --auto-recover                    Attempt automatic recovery of issues"
                echo "  --verbose                         Show verbose output"
                echo "  --help                            Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Main function
main() {
    # Parse command-line arguments
    parse_args "$@"
    
    # Initialize logging
    log_message "Starting health check for Revolucare platform in ${ENVIRONMENT} environment" "INFO"
    
    # Set environment-specific variables
    case "${ENVIRONMENT}" in
        dev)
            # Development environment defaults (already set)
            log_message "Using development environment configuration" "DEBUG"
            ;;
        staging)
            # Override with staging environment defaults if not explicitly set
            if [[ "${API_URL}" == "http://localhost:3000/api" ]]; then
                API_URL="https://staging-api.revolucare.com/api"
            fi
            if [[ "${WEB_URL}" == "http://localhost:3000" ]]; then
                WEB_URL="https://staging.revolucare.com"
            fi
            log_message "Using staging environment configuration" "DEBUG"
            ;;
        prod)
            # Override with production environment defaults if not explicitly set
            if [[ "${API_URL}" == "http://localhost:3000/api" ]]; then
                API_URL="https://api.revolucare.com/api"
            fi
            if [[ "${WEB_URL}" == "http://localhost:3000" ]]; then
                WEB_URL="https://revolucare.com"
            fi
            log_message "Using production environment configuration" "DEBUG"
            ;;
        *)
            log_message "Unknown environment: ${ENVIRONMENT}, using default configuration" "WARNING"
            ;;
    esac
    
    # Check dependencies
    check_dependencies
    local deps_status=$?
    if [[ ${deps_status} -ne 0 ]]; then
        exit ${deps_status}
    fi
    
    # Perform health checks
    local overall_status=${STATUS_OK}
    
    # Check backend API health
    check_backend_health
    local backend_status=$?
    overall_status=$((overall_status | backend_status))
    
    # Check backend API readiness
    check_backend_readiness
    local readiness_status=$?
    overall_status=$((overall_status | readiness_status))
    
    # Check web frontend health
    check_web_health
    local web_status=$?
    overall_status=$((overall_status | web_status))
    
    # Check database health
    check_database_health
    local db_status=$?
    overall_status=$((overall_status | db_status))
    
    # Check Redis cache health
    check_redis_health
    local redis_status=$?
    overall_status=$((overall_status | redis_status))
    
    # Check Kubernetes resources health
    check_kubernetes_resources
    local k8s_status=$?
    overall_status=$((overall_status | k8s_status))
    
    # Check external services health
    check_external_services
    local ext_status=$?
    overall_status=$((overall_status | ext_status))
    
    # Check storage health
    check_storage_health
    local storage_status=$?
    overall_status=$((overall_status | storage_status))
    
    # Generate health report
    local report=$(generate_health_report)
    
    # Output health report
    if [[ "${OUTPUT_FORMAT}" == "json" ]]; then
        # Generate JSON output
        local json_output="{"
        json_output+="\"timestamp\":\"$(date +"%Y-%m-%d %H:%M:%S")\","
        json_output+="\"environment\":\"${ENVIRONMENT}\","
        json_output+="\"overall_status\":\"${overall_status}\","
        json_output+="\"components\":{"
        
        local first=true
        for component in "${!HEALTH_RESULTS[@]}"; do
            if [[ "${first}" != true ]]; then
                json_output+=","
            fi
            json_output+="\"${component}\":${HEALTH_RESULTS[$component]}"
            first=false
        done
        
        json_output+="}}"
        
        echo "${json_output}" | jq .
    else
        # Output text report
        echo -e "${report}"
    fi
    
    # Send notifications for issues
    send_notifications "${HEALTH_RESULTS}" "${report}"
    
    # Attempt recovery for detected issues
    attempt_recovery "${HEALTH_RESULTS}"
    
    # Log completion
    log_message "Health check completed with status code ${overall_status}" "INFO"
    
    # Exit with appropriate status code
    exit ${overall_status}
}

# Execute main function with all arguments
main "$@"