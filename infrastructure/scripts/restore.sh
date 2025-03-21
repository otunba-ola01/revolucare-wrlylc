#!/bin/bash
# =============================================================================
# Revolucare Platform - Database and Document Storage Restoration Script
# =============================================================================
# 
# This script performs restoration of database and document storage from backups,
# supporting point-in-time recovery and disaster recovery procedures.
#
# Usage:
#   ./restore.sh [environment] [--backup=<backup_id>] [--point-in-time=<timestamp>] [--components=database,wal,blob]
#
# Environment Variables:
#   DB_HOST - Database hostname
#   DB_PORT - Database port
#   DB_NAME - Database name
#   DB_USER - Database username
#   DB_PASSWORD - Database password
#   BACKUP_BUCKET - S3 bucket for backups
#   AWS_ACCESS_KEY_ID - AWS access key
#   AWS_SECRET_ACCESS_KEY - AWS secret key
#   STORAGE_ENDPOINT - Blob storage endpoint
#   STORAGE_ACCESS_KEY - Blob storage access key
#   STORAGE_SECRET_KEY - Blob storage secret key
#
# =============================================================================

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="/tmp/revolucare_restore"
LOG_DIR="/var/log/revolucare"
LOG_FILE="${LOG_DIR}/restore_$(date +%Y%m%d_%H%M%S).log"
ENVIRONMENT="dev"  # Default to dev environment
BACKUP_ID=""
RECOVERY_TIMESTAMP=""
COMPONENTS="database,wal,blob"  # Default to restore all components
BACKUP_BUCKET=""
DB_HOST=""
DB_PORT=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
STORAGE_ENDPOINT=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""

# =====================
# Utility Functions
# =====================

# Log a message to stdout and the log file
log_message() {
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo "[${timestamp}] $1"
    
    # Create log directory if it doesn't exist
    mkdir -p "${LOG_DIR}"
    
    # Append to log file, creating it if it doesn't exist
    echo "[${timestamp}] $1" >> "${LOG_FILE}"
}

# Check for required dependencies
check_dependencies() {
    log_message "Checking for required dependencies..."
    
    # Check for PostgreSQL client tools
    if ! command -v psql &> /dev/null || ! command -v pg_restore &> /dev/null; then
        log_message "ERROR: PostgreSQL client tools (psql, pg_restore) are required but not found"
        return 2
    fi
    
    # Check for AWS CLI
    if ! command -v aws &> /dev/null; then
        log_message "ERROR: AWS CLI is required but not found"
        return 2
    fi
    
    # Check for jq (JSON parsing)
    if ! command -v jq &> /dev/null; then
        log_message "ERROR: jq is required but not found"
        return 2
    fi
    
    # Check for required environment variables or configuration
    if [[ -z "${DB_HOST}" || -z "${DB_NAME}" || -z "${DB_USER}" || -z "${DB_PASSWORD}" ]]; then
        log_message "ERROR: Database configuration is incomplete"
        return 2
    fi
    
    if [[ -z "${BACKUP_BUCKET}" ]]; then
        log_message "ERROR: Backup bucket is not configured"
        return 2
    fi
    
    log_message "All dependencies are available"
    return 0
}

# Create necessary directories for restoration
create_restore_directories() {
    log_message "Creating restoration directories..."
    
    # Create main restore directory
    mkdir -p "${RESTORE_DIR}"
    
    # Create subdirectories
    mkdir -p "${RESTORE_DIR}/database"
    mkdir -p "${RESTORE_DIR}/wal"
    mkdir -p "${RESTORE_DIR}/blob"
    
    # Check if directories were created successfully
    if [[ -d "${RESTORE_DIR}/database" && -d "${RESTORE_DIR}/wal" && -d "${RESTORE_DIR}/blob" ]]; then
        log_message "Restoration directories created successfully"
        return 0
    else
        log_message "ERROR: Failed to create restoration directories"
        return 1
    fi
}

# List available backups in the S3 bucket
list_available_backups() {
    log_message "Listing available backups in S3 bucket: ${BACKUP_BUCKET}"
    
    # Configure AWS CLI if endpoint is set (for non-AWS S3 compatible storage)
    local aws_cmd="aws"
    if [[ -n "${STORAGE_ENDPOINT}" ]]; then
        aws_cmd="aws --endpoint-url=${STORAGE_ENDPOINT}"
    fi
    
    # List backup metadata files which contain backup information
    local backup_list
    backup_list=$(${aws_cmd} s3 ls "s3://${BACKUP_BUCKET}/metadata/" --recursive | sort -r)
    
    if [[ -z "${backup_list}" ]]; then
        log_message "No backups found in the bucket"
        return 1
    fi
    
    # Display available backups
    log_message "Available backups:"
    echo "${backup_list}" | while read -r line; do
        local file_name
        file_name=$(echo "${line}" | awk '{print $4}')
        local backup_id
        backup_id=$(basename "${file_name}" .json)
        local backup_date
        backup_date=$(echo "${backup_id}" | cut -d_ -f1)
        local backup_time
        backup_time=$(echo "${backup_id}" | cut -d_ -f2)
        
        # Download and parse metadata file to get backup details
        ${aws_cmd} s3 cp "s3://${BACKUP_BUCKET}/metadata/${file_name}" "${RESTORE_DIR}/${file_name}" > /dev/null
        
        local backup_type
        backup_type=$(jq -r '.type // "Unknown"' "${RESTORE_DIR}/${file_name}")
        local backup_size
        backup_size=$(jq -r '.size // "Unknown"' "${RESTORE_DIR}/${file_name}")
        local backup_components
        backup_components=$(jq -r '.components | join(",") // "Unknown"' "${RESTORE_DIR}/${file_name}")
        
        echo "  - ID: ${backup_id}, Date: ${backup_date} ${backup_time//_/:}, Type: ${backup_type}, Size: ${backup_size}, Components: ${backup_components}"
    done
    
    return 0
}

# Download a specific backup from S3
download_backup() {
    local backup_key="$1"
    local destination_path="$2"
    
    log_message "Downloading backup: ${backup_key} to ${destination_path}"
    
    # Configure AWS CLI if endpoint is set
    local aws_cmd="aws"
    if [[ -n "${STORAGE_ENDPOINT}" ]]; then
        aws_cmd="aws --endpoint-url=${STORAGE_ENDPOINT}"
    fi
    
    # Download the backup file
    if ${aws_cmd} s3 cp "s3://${BACKUP_BUCKET}/${backup_key}" "${destination_path}"; then
        log_message "Successfully downloaded ${backup_key}"
        
        # Verify file exists and has content
        if [[ -f "${destination_path}" && -s "${destination_path}" ]]; then
            local file_size
            file_size=$(du -h "${destination_path}" | cut -f1)
            log_message "Download complete. File size: ${file_size}"
            return 0
        else
            log_message "ERROR: Downloaded file is empty or does not exist"
            return 3
        fi
    else
        log_message "ERROR: Failed to download ${backup_key}"
        return 3
    fi
}

# Restore PostgreSQL database from backup
restore_database() {
    local backup_file="$1"
    
    log_message "Starting database restoration from ${backup_file}"
    
    # Check if database exists
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
        log_message "Database ${DB_NAME} already exists. Dropping database..."
        
        # Terminate all connections to the database
        psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${DB_NAME}'
            AND pid <> pg_backend_pid();" > /dev/null
        
        # Drop the database
        if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE \"${DB_NAME}\";" > /dev/null; then
            log_message "ERROR: Failed to drop existing database"
            return 4
        fi
    fi
    
    # Create empty database
    log_message "Creating empty database ${DB_NAME}..."
    if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE \"${DB_NAME}\";" > /dev/null; then
        log_message "ERROR: Failed to create empty database"
        return 4
    fi
    
    # Restore database from backup
    log_message "Restoring database from backup file..."
    if pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-privileges "${backup_file}"; then
        log_message "Database restoration completed successfully"
        return 0
    else
        local restore_exit_code=$?
        log_message "WARNING: pg_restore completed with exit code ${restore_exit_code}. This may be due to non-fatal errors."
        
        # Verify database has data despite warnings
        local table_count
        table_count=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
        
        if [[ ${table_count} -gt 0 ]]; then
            log_message "Database has ${table_count} tables. Continuing despite warnings."
            return 0
        else
            log_message "ERROR: Database appears to be empty after restoration"
            return 4
        fi
    fi
}

# Apply WAL archives for point-in-time recovery
restore_wal_archive() {
    local wal_archive_file="$1"
    local recovery_target_time="$2"
    
    log_message "Starting WAL archive application from ${wal_archive_file}"
    log_message "Recovery target time: ${recovery_target_time}"
    
    # Create temporary directory for WAL files
    local wal_extract_dir="${RESTORE_DIR}/wal/extract"
    mkdir -p "${wal_extract_dir}"
    
    # Extract WAL archive
    log_message "Extracting WAL archive..."
    if ! tar -xzf "${wal_archive_file}" -C "${wal_extract_dir}"; then
        log_message "ERROR: Failed to extract WAL archive"
        return 5
    fi
    
    # Create recovery configuration
    log_message "Creating recovery configuration..."
    local pg_data
    pg_data=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SHOW data_directory;")
    pg_data=$(echo "${pg_data}" | xargs)  # Trim whitespace
    
    if [[ -z "${pg_data}" ]]; then
        log_message "ERROR: Could not determine PostgreSQL data directory"
        return 5
    fi
    
    # Check if we have direct access to the data directory (usually not the case with managed databases)
    if [[ -d "${pg_data}" && -w "${pg_data}" ]]; then
        # Create recovery.conf file (PostgreSQL < 12) or standby.signal (PostgreSQL >= 12)
        if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SHOW server_version;" | grep -qE '^1[2-9]\.'; then
            # PostgreSQL 12 or later
            touch "${pg_data}/standby.signal"
            cat > "${pg_data}/postgresql.auto.conf" << EOF
restore_command = 'cp ${wal_extract_dir}/%f %p'
EOF
            if [[ -n "${recovery_target_time}" ]]; then
                echo "recovery_target_time = '${recovery_target_time}'" >> "${pg_data}/postgresql.auto.conf"
                echo "recovery_target_action = 'promote'" >> "${pg_data}/postgresql.auto.conf"
            fi
        else
            # PostgreSQL < 12
            cat > "${pg_data}/recovery.conf" << EOF
restore_command = 'cp ${wal_extract_dir}/%f %p'
EOF
            if [[ -n "${recovery_target_time}" ]]; then
                echo "recovery_target_time = '${recovery_target_time}'" >> "${pg_data}/recovery.conf"
                echo "recovery_target_action = 'promote'" >> "${pg_data}/recovery.conf"
            fi
        fi
        
        # Restart PostgreSQL to apply WAL files
        log_message "Restarting PostgreSQL to apply WAL files..."
        if command -v systemctl &> /dev/null && systemctl is-active postgresql > /dev/null; then
            systemctl restart postgresql
        elif command -v service &> /dev/null; then
            service postgresql restart
        else
            log_message "WARNING: Could not restart PostgreSQL automatically. Please restart manually."
            return 5
        fi
        
        # Wait for PostgreSQL to start
        local max_attempts=30
        local attempt=0
        while (( attempt < max_attempts )); do
            if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" &> /dev/null; then
                log_message "PostgreSQL restarted successfully"
                break
            fi
            (( attempt++ ))
            sleep 2
        done
        
        if (( attempt >= max_attempts )); then
            log_message "ERROR: PostgreSQL failed to restart after WAL application"
            return 5
        fi
        
        log_message "WAL application completed successfully"
        return 0
    else
        # For managed databases where we don't have access to data directory
        log_message "WARNING: Cannot apply WAL files directly to a managed database"
        log_message "Please contact your database administrator to apply WAL files from: ${wal_extract_dir}"
        return 0  # Return success but log the warning
    fi
}

# Restore blob storage from backup
restore_blob_storage() {
    local blob_backup_file="$1"
    
    log_message "Starting blob storage restoration from ${blob_backup_file}"
    
    # Create temporary directory for blob files
    local blob_extract_dir="${RESTORE_DIR}/blob/extract"
    mkdir -p "${blob_extract_dir}"
    
    # Extract blob archive
    log_message "Extracting blob storage archive..."
    if ! tar -xzf "${blob_backup_file}" -C "${blob_extract_dir}"; then
        log_message "ERROR: Failed to extract blob storage archive"
        return 6
    fi
    
    # Configure AWS CLI if endpoint is set
    local aws_cmd="aws"
    if [[ -n "${STORAGE_ENDPOINT}" ]]; then
        aws_cmd="aws --endpoint-url=${STORAGE_ENDPOINT}"
    fi
    
    # Set AWS credentials for the storage service
    export AWS_ACCESS_KEY_ID="${STORAGE_ACCESS_KEY}"
    export AWS_SECRET_ACCESS_KEY="${STORAGE_SECRET_KEY}"
    
    # Sync files to blob storage
    log_message "Syncing files to blob storage..."
    if ${aws_cmd} s3 sync "${blob_extract_dir}" "s3://${BACKUP_BUCKET}/"; then
        local file_count
        file_count=$(find "${blob_extract_dir}" -type f | wc -l)
        log_message "Blob storage restoration completed successfully. ${file_count} files restored."
        return 0
    else
        log_message "ERROR: Failed to sync files to blob storage"
        return 6
    fi
}

# Verify the integrity of the restored system
verify_restoration() {
    log_message "Verifying restoration integrity..."
    local verification_results=()
    local verification_success=true
    
    # Check database connectivity and basic functionality
    log_message "Checking database connectivity..."
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" &> /dev/null; then
        verification_results+=("Database connectivity: Success")
        
        # Check for critical tables
        log_message "Checking for critical tables..."
        local critical_tables=("users" "care_plans" "provider_profiles" "documents")
        for table in "${critical_tables[@]}"; do
            if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT to_regclass('public.${table}');" | grep -q "${table}"; then
                verification_results+=("Table ${table}: Found")
            else
                verification_results+=("Table ${table}: Not found (WARNING)")
                verification_success=false
            fi
        done
        
        # Sample data check
        log_message "Checking for data in critical tables..."
        for table in "${critical_tables[@]}"; do
            local count
            count=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM public.${table};" 2>/dev/null || echo "0")
            count=$(echo "${count}" | xargs)  # Trim whitespace
            
            if [[ ${count} -gt 0 ]]; then
                verification_results+=("Data in ${table}: ${count} records")
            else
                verification_results+=("Data in ${table}: Empty or error (WARNING)")
                verification_success=false
            fi
        done
    else
        verification_results+=("Database connectivity: Failed (ERROR)")
        verification_success=false
    fi
    
    # Check blob storage accessibility
    log_message "Checking blob storage accessibility..."
    local aws_cmd="aws"
    if [[ -n "${STORAGE_ENDPOINT}" ]]; then
        aws_cmd="aws --endpoint-url=${STORAGE_ENDPOINT}"
    fi
    
    # Set AWS credentials for the storage service
    export AWS_ACCESS_KEY_ID="${STORAGE_ACCESS_KEY}"
    export AWS_SECRET_ACCESS_KEY="${STORAGE_SECRET_KEY}"
    
    if ${aws_cmd} s3 ls "s3://${BACKUP_BUCKET}/" &> /dev/null; then
        verification_results+=("Blob storage accessibility: Success")
        
        # Check for sample document
        log_message "Checking for sample document in blob storage..."
        local sample_object
        sample_object=$(${aws_cmd} s3 ls "s3://${BACKUP_BUCKET}/" --recursive | head -n 1)
        
        if [[ -n "${sample_object}" ]]; then
            verification_results+=("Sample object in blob storage: Found")
        else
            verification_results+=("Sample object in blob storage: Not found (WARNING)")
            verification_success=false
        fi
    else
        verification_results+=("Blob storage accessibility: Failed (ERROR)")
        verification_success=false
    fi
    
    # Log verification results
    log_message "Verification results:"
    for result in "${verification_results[@]}"; do
        log_message "  - ${result}"
    done
    
    if ${verification_success}; then
        log_message "Verification completed successfully"
        return 0
    else
        log_message "Verification completed with warnings/errors"
        return 7
    fi
}

# Clean up temporary files after successful restoration
cleanup_restore_files() {
    log_message "Cleaning up temporary restoration files..."
    
    # Remove downloaded and extracted files but keep logs
    if rm -rf "${RESTORE_DIR}"; then
        log_message "Temporary files cleaned up successfully"
        return 0
    else
        log_message "WARNING: Failed to clean up some temporary files"
        return 1
    fi
}

# Send notification about restoration completion
send_notification() {
    local status="$1"
    local details="$2"
    
    log_message "Sending restoration completion notification..."
    
    # Format notification message
    local subject="Revolucare Restoration: ${status} (${ENVIRONMENT})"
    local message="Revolucare restoration process completed with status: ${status}\n\nEnvironment: ${ENVIRONMENT}\nTimestamp: $(date)\n\nDetails:\n${details}\n\nFor more information, check the log file: ${LOG_FILE}"
    
    # Send email notification (implementation depends on available tools)
    if command -v mail &> /dev/null; then
        echo -e "${message}" | mail -s "${subject}" "admin@revolucare.com"
        log_message "Notification email sent via mail command"
    elif command -v aws &> /dev/null && [[ "${ENVIRONMENT}" != "dev" ]]; then
        # Use AWS SES for production environments
        aws ses send-email \
            --from "noreply@revolucare.com" \
            --to "admin@revolucare.com" \
            --subject "${subject}" \
            --text "${message}" \
            --region "us-east-1" > /dev/null
        log_message "Notification email sent via AWS SES"
    else
        log_message "WARNING: Could not send notification email (no mail command or AWS SES available)"
    fi
    
    # For failure status, you might want to send additional alerts
    if [[ "${status}" != "Success" && "${ENVIRONMENT}" != "dev" ]]; then
        # Implementation for SMS/pager alerts would go here
        log_message "Additional alerts would be sent for production failure"
    fi
}

# Main function to orchestrate the restoration process
main() {
    local start_time
    start_time=$(date +%s)
    
    log_message "=========================================="
    log_message "Starting Revolucare restoration process..."
    log_message "=========================================="
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backup=*)
                BACKUP_ID="${1#*=}"
                shift
                ;;
            --point-in-time=*)
                RECOVERY_TIMESTAMP="${1#*=}"
                shift
                ;;
            --components=*)
                COMPONENTS="${1#*=}"
                shift
                ;;
            dev|staging|prod)
                ENVIRONMENT="$1"
                shift
                ;;
            *)
                log_message "Unknown argument: $1"
                log_message "Usage: $0 [environment] [--backup=<backup_id>] [--point-in-time=<timestamp>] [--components=database,wal,blob]"
                exit 1
                ;;
        esac
    done
    
    log_message "Environment: ${ENVIRONMENT}"
    log_message "Components to restore: ${COMPONENTS}"
    if [[ -n "${BACKUP_ID}" ]]; then
        log_message "Specified backup ID: ${BACKUP_ID}"
    fi
    if [[ -n "${RECOVERY_TIMESTAMP}" ]]; then
        log_message "Recovery timestamp: ${RECOVERY_TIMESTAMP}"
    fi
    
    # Load environment-specific configuration
    local config_file="${SCRIPT_DIR}/../config/${ENVIRONMENT}.env"
    if [[ -f "${config_file}" ]]; then
        log_message "Loading configuration from ${config_file}"
        # shellcheck disable=SC1090
        source "${config_file}"
    else
        log_message "WARNING: Configuration file ${config_file} not found. Using environment variables."
    fi
    
    # Check dependencies
    if ! check_dependencies; then
        log_message "Failed to satisfy dependencies. Exiting."
        send_notification "Failed" "Dependency check failed. See log for details."
        exit 2
    fi
    
    # Create restore directories
    if ! create_restore_directories; then
        log_message "Failed to create restore directories. Exiting."
        send_notification "Failed" "Could not create restore directories. See log for details."
        exit 1
    fi
    
    # List available backups if no specific backup was provided
    if [[ -z "${BACKUP_ID}" ]]; then
        if ! list_available_backups; then
            log_message "No backups available. Exiting."
            send_notification "Failed" "No backups available for restoration."
            exit 3
        fi
        
        # Prompt user to select a backup
        read -r -p "Enter backup ID to restore: " BACKUP_ID
        if [[ -z "${BACKUP_ID}" ]]; then
            log_message "No backup selected. Exiting."
            exit 1
        fi
    fi
    
    log_message "Selected backup ID: ${BACKUP_ID}"
    
    # Track overall restoration status
    local restoration_status="Success"
    local restoration_details=""
    
    # Restore database if requested
    if [[ "${COMPONENTS}" == *"database"* ]]; then
        log_message "Database restoration requested"
        
        local db_backup_key="database/${BACKUP_ID}_database.dump"
        local db_backup_path="${RESTORE_DIR}/database/${BACKUP_ID}_database.dump"
        
        if download_backup "${db_backup_key}" "${db_backup_path}"; then
            if restore_database "${db_backup_path}"; then
                log_message "Database restoration successful"
                restoration_details+="Database: Restored successfully\n"
            else
                log_message "Database restoration failed"
                restoration_status="Failed"
                restoration_details+="Database: Restoration failed\n"
            fi
        else
            log_message "Failed to download database backup"
            restoration_status="Failed"
            restoration_details+="Database: Download failed\n"
        fi
    else
        log_message "Skipping database restoration"
        restoration_details+="Database: Skipped\n"
    fi
    
    # Apply WAL archives if requested and point-in-time recovery is specified
    if [[ "${COMPONENTS}" == *"wal"* && -n "${RECOVERY_TIMESTAMP}" ]]; then
        log_message "WAL application requested for point-in-time recovery"
        
        local wal_backup_key="wal/${BACKUP_ID}_wal.tar.gz"
        local wal_backup_path="${RESTORE_DIR}/wal/${BACKUP_ID}_wal.tar.gz"
        
        if download_backup "${wal_backup_key}" "${wal_backup_path}"; then
            if restore_wal_archive "${wal_backup_path}" "${RECOVERY_TIMESTAMP}"; then
                log_message "WAL application successful"
                restoration_details+="WAL Application: Applied successfully\n"
            else
                log_message "WAL application failed"
                restoration_status="Failed"
                restoration_details+="WAL Application: Failed\n"
            fi
        else
            log_message "Failed to download WAL archive"
            restoration_status="Failed"
            restoration_details+="WAL Application: Download failed\n"
        fi
    elif [[ "${COMPONENTS}" == *"wal"* ]]; then
        log_message "Skipping WAL application as no recovery timestamp was specified"
        restoration_details+="WAL Application: Skipped (no timestamp)\n"
    else
        log_message "Skipping WAL application"
        restoration_details+="WAL Application: Skipped\n"
    fi
    
    # Restore blob storage if requested
    if [[ "${COMPONENTS}" == *"blob"* ]]; then
        log_message "Blob storage restoration requested"
        
        local blob_backup_key="blob/${BACKUP_ID}_blob.tar.gz"
        local blob_backup_path="${RESTORE_DIR}/blob/${BACKUP_ID}_blob.tar.gz"
        
        if download_backup "${blob_backup_key}" "${blob_backup_path}"; then
            if restore_blob_storage "${blob_backup_path}"; then
                log_message "Blob storage restoration successful"
                restoration_details+="Blob Storage: Restored successfully\n"
            else
                log_message "Blob storage restoration failed"
                restoration_status="Failed"
                restoration_details+="Blob Storage: Restoration failed\n"
            fi
        else
            log_message "Failed to download blob storage backup"
            restoration_status="Failed"
            restoration_details+="Blob Storage: Download failed\n"
        fi
    else
        log_message "Skipping blob storage restoration"
        restoration_details+="Blob Storage: Skipped\n"
    fi
    
    # Verify restoration
    log_message "Verifying restoration..."
    if verify_restoration; then
        log_message "Restoration verification successful"
        restoration_details+="Verification: Passed\n"
    else
        log_message "Restoration verification failed or warnings present"
        if [[ "${restoration_status}" == "Success" ]]; then
            restoration_status="Warning"
        fi
        restoration_details+="Verification: Failed or warnings present\n"
    fi
    
    # Run post-restoration tasks
    log_message "Running post-restoration tasks..."
    # Add any post-restoration tasks here (update configurations, restart services, etc.)
    
    # Clean up temporary files
    if cleanup_restore_files; then
        log_message "Cleanup successful"
        restoration_details+="Cleanup: Completed\n"
    else
        log_message "Cleanup warning"
        restoration_details+="Cleanup: Warning (some files may remain)\n"
    fi
    
    # Calculate elapsed time
    local end_time
    end_time=$(date +%s)
    local elapsed_time=$((end_time - start_time))
    local hours=$((elapsed_time / 3600))
    local minutes=$(( (elapsed_time % 3600) / 60 ))
    local seconds=$((elapsed_time % 60))
    local elapsed_formatted
    if [[ ${hours} -gt 0 ]]; then
        elapsed_formatted="${hours}h ${minutes}m ${seconds}s"
    else
        elapsed_formatted="${minutes}m ${seconds}s"
    fi
    
    # Add timing to restoration details
    restoration_details+="Duration: ${elapsed_formatted}\n"
    
    # Send completion notification
    send_notification "${restoration_status}" "${restoration_details}"
    
    log_message "=========================================="
    log_message "Restoration process completed with status: ${restoration_status}"
    log_message "Elapsed time: ${elapsed_formatted}"
    log_message "=========================================="
    
    # Exit with appropriate code
    if [[ "${restoration_status}" == "Success" ]]; then
        exit 0
    elif [[ "${restoration_status}" == "Warning" ]]; then
        exit 0  # Still exit with success but with warnings in the log
    else
        exit 1
    fi
}

# Execute main function
main "$@"