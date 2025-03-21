#!/bin/bash
#
# Comprehensive backup script for Revolucare platform
#
# This script performs full database backups, WAL archiving, and blob storage backups
# according to the defined backup strategy. It implements the multi-tier backup strategy
# with appropriate retention policies for maintaining daily, monthly, and yearly backups.
#
# Usage: ./backup.sh [environment]
#
# Environment variables required:
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
#   RETENTION_DAYS - Number of days to retain daily backups

set -e

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DATE_YMD=$(date +%Y%m%d)
BACKUP_DIR="/tmp/revolucare_backups/${DATE_YMD}"
LOG_DIR="/var/log/revolucare/backups"
LOG_FILE="${LOG_DIR}/backup_${TIMESTAMP}.log"
CONFIG_FILE="${SCRIPT_DIR}/backup_config.json"
ENVIRONMENT=${1:-"dev"}
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Function: log_message
# Description: Logs a message to both stdout and the log file
# Parameters:
#   $1: message - The message to log
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local log_entry="[${timestamp}] ${message}"
    
    echo "${log_entry}"
    
    # Ensure log directory exists
    mkdir -p "${LOG_DIR}"
    
    # Append to log file
    echo "${log_entry}" >> "${LOG_FILE}"
}

# Function: check_dependencies
# Description: Checks if required tools and dependencies are installed
# Returns:
#   0 if all dependencies are available, non-zero otherwise
check_dependencies() {
    local exit_code=0
    
    log_message "Checking dependencies..."
    
    # Check for pg_dump
    if ! command -v pg_dump &> /dev/null; then
        log_message "ERROR: pg_dump is not installed or not in PATH"
        exit_code=2
    fi
    
    # Check for pg_basebackup
    if ! command -v pg_basebackup &> /dev/null; then
        log_message "ERROR: pg_basebackup is not installed or not in PATH"
        exit_code=2
    fi
    
    # Check for AWS CLI
    if ! command -v aws &> /dev/null; then
        log_message "ERROR: AWS CLI is not installed or not in PATH"
        exit_code=2
    fi
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        log_message "ERROR: jq is not installed or not in PATH"
        exit_code=2
    fi
    
    # Check required environment variables
    local required_vars=("DB_HOST" "DB_PORT" "DB_NAME" "DB_USER" "DB_PASSWORD" "BACKUP_BUCKET")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            log_message "ERROR: Required environment variable ${var} is not set"
            exit_code=2
        fi
    done
    
    if [[ ${exit_code} -eq 0 ]]; then
        log_message "All dependencies are available"
    fi
    
    return ${exit_code}
}

# Function: create_backup_directories
# Description: Creates the necessary directory structure for backups
# Returns:
#   true if directories created successfully, false otherwise
create_backup_directories() {
    log_message "Creating backup directories..."
    
    mkdir -p "${BACKUP_DIR}/database"
    mkdir -p "${BACKUP_DIR}/wal"
    mkdir -p "${BACKUP_DIR}/blob"
    
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Failed to create backup directories"
        return 1
    fi
    
    # Set appropriate permissions
    chmod 700 "${BACKUP_DIR}"
    
    log_message "Backup directories created successfully"
    return 0
}

# Function: backup_database
# Description: Creates a full backup of the PostgreSQL database
# Returns:
#   Path to the created backup file
backup_database() {
    local backup_file="${BACKUP_DIR}/database/revolucare_${DB_NAME}_${TIMESTAMP}.dump"
    
    log_message "Starting database backup to ${backup_file}..."
    
    # Use PGPASSWORD to avoid password prompt
    export PGPASSWORD="${DB_PASSWORD}"
    
    # Create backup with pg_dump
    pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -Fc -v -f "${backup_file}" "${DB_NAME}"
    
    local result=$?
    unset PGPASSWORD
    
    if [[ ${result} -ne 0 ]]; then
        log_message "ERROR: Database backup failed with exit code ${result}"
        return 3
    fi
    
    # Compress the backup
    gzip -f "${backup_file}"
    backup_file="${backup_file}.gz"
    
    # Get backup size
    local backup_size=$(du -h "${backup_file}" | cut -f1)
    
    log_message "Database backup completed successfully (${backup_size})"
    echo "${backup_file}"
}

# Function: backup_wal_logs
# Description: Archives Write-Ahead Log (WAL) files for point-in-time recovery
# Returns:
#   Path to the WAL archive
backup_wal_logs() {
    local wal_archive_dir="${BACKUP_DIR}/wal"
    local wal_archive_file="${wal_archive_dir}/revolucare_wal_${TIMESTAMP}.tar.gz"
    
    log_message "Starting WAL archiving to ${wal_archive_file}..."
    
    # Use PGPASSWORD to avoid password prompt
    export PGPASSWORD="${DB_PASSWORD}"
    
    # Check if replication slot exists, create if not
    local replication_slot="revolucare_backup_slot"
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT * FROM pg_create_physical_replication_slot('${replication_slot}', true, false);" &>/dev/null || true
    
    # Archive WAL logs
    pg_basebackup -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -D "${wal_archive_dir}/data" -Xs -P -R
    
    local result=$?
    unset PGPASSWORD
    
    if [[ ${result} -ne 0 ]]; then
        log_message "ERROR: WAL archiving failed with exit code ${result}"
        return 4
    fi
    
    # Create archive from WAL files
    tar -czf "${wal_archive_file}" -C "${wal_archive_dir}" data
    
    # Cleanup the extracted data
    rm -rf "${wal_archive_dir}/data"
    
    # Get archive size
    local archive_size=$(du -h "${wal_archive_file}" | cut -f1)
    
    log_message "WAL archiving completed successfully (${archive_size})"
    echo "${wal_archive_file}"
}

# Function: backup_blob_storage
# Description: Creates a backup of the document storage
# Returns:
#   Path to the blob storage backup
backup_blob_storage() {
    local blob_backup_dir="${BACKUP_DIR}/blob"
    local blob_backup_file="${blob_backup_dir}/revolucare_blob_${TIMESTAMP}.tar.gz"
    
    log_message "Starting blob storage backup to ${blob_backup_dir}..."
    
    # Configure AWS CLI with storage credentials
    export AWS_ACCESS_KEY_ID="${STORAGE_ACCESS_KEY}"
    export AWS_SECRET_ACCESS_KEY="${STORAGE_SECRET_KEY}"
    
    # Use AWS S3 sync to create a local copy of blob storage
    aws s3 sync "${STORAGE_ENDPOINT}" "${blob_backup_dir}/data" --no-sign-request
    
    local result=$?
    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
    
    if [[ ${result} -ne 0 ]]; then
        log_message "ERROR: Blob storage backup failed with exit code ${result}"
        return 5
    fi
    
    # Create archive from blob files
    tar -czf "${blob_backup_file}" -C "${blob_backup_dir}" data
    
    # Cleanup the extracted data
    rm -rf "${blob_backup_dir}/data"
    
    # Get backup size
    local backup_size=$(du -h "${blob_backup_file}" | cut -f1)
    
    log_message "Blob storage backup completed successfully (${backup_size})"
    echo "${blob_backup_file}"
}

# Function: upload_to_s3
# Description: Uploads backup files to S3 storage
# Parameters:
#   $1: local_file_path - Path to the local file to upload
#   $2: s3_destination - S3 destination path
# Returns:
#   true if upload successful, false otherwise
upload_to_s3() {
    local local_file_path="$1"
    local s3_destination="$2"
    local filename=$(basename "${local_file_path}")
    
    log_message "Uploading ${filename} to ${s3_destination}..."
    
    # Configure AWS CLI
    export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
    
    # Determine storage class based on backup type and date
    local storage_class="STANDARD"
    local current_date=$(date +%Y%m%d)
    local file_date=$(echo "${filename}" | grep -oE "[0-9]{8}" | head -1)
    
    # Use date math to determine age of backup
    local days_old=0
    if [[ -n "${file_date}" ]]; then
        days_old=$(( ( $(date -d "${current_date}" +%s) - $(date -d "${file_date}" +%s) ) / 86400 ))
    fi
    
    # Apply storage tiering
    if [[ ${days_old} -gt 30 ]]; then
        storage_class="STANDARD_IA"
        
        # For yearly backups (January 1st) older than 1 year, use Glacier
        if [[ "${file_date:4:4}" == "0101" && ${days_old} -gt 365 ]]; then
            storage_class="GLACIER"
        fi
    fi
    
    # Upload file to S3 with appropriate metadata
    aws s3 cp "${local_file_path}" "${s3_destination}/${filename}" \
        --storage-class "${storage_class}" \
        --metadata "CreatedBy=revolucare-backup,Environment=${ENVIRONMENT},Timestamp=${TIMESTAMP}" \
        --expected-size $(stat -c %s "${local_file_path}")
    
    local result=$?
    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
    
    if [[ ${result} -ne 0 ]]; then
        log_message "ERROR: Upload of ${filename} failed with exit code ${result}"
        return 1
    fi
    
    log_message "Upload of ${filename} completed successfully to ${s3_destination}/${filename}"
    return 0
}

# Function: apply_retention_policy
# Description: Applies retention policy to remove old backups
# Returns:
#   Number of backups removed
apply_retention_policy() {
    log_message "Applying retention policy (keeping daily backups for ${RETENTION_DAYS} days)..."
    
    # Configure AWS CLI
    export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
    
    local removed_count=0
    local s3_bucket="s3://${BACKUP_BUCKET}"
    local current_date=$(date +%Y%m%d)
    
    # List all backups
    local all_backups=$(aws s3 ls "${s3_bucket}" --recursive | grep -E '\.gz$' | awk '{print $4}')
    
    for backup in ${all_backups}; do
        local filename=$(basename "${backup}")
        local file_date=$(echo "${filename}" | grep -oE "[0-9]{8}" | head -1)
        
        # Skip if can't determine date
        if [[ -z "${file_date}" ]]; then
            continue
        fi
        
        # Calculate age in days
        local days_old=$(( ( $(date -d "${current_date}" +%s) - $(date -d "${file_date}" +%s) ) / 86400 ))
        
        # Check if backup should be kept based on retention policy
        local keep=false
        
        # Keep all backups within retention period
        if [[ ${days_old} -le ${RETENTION_DAYS} ]]; then
            keep=true
        fi
        
        # Keep monthly backups (1st of month) for 12 months
        if [[ "${file_date:6:2}" == "01" && ${days_old} -le 365 ]]; then
            keep=true
        fi
        
        # Keep yearly backups (January 1st) for 7 years
        if [[ "${file_date:4:4}" == "0101" && ${days_old} -le 2557 ]]; then
            keep=true
        fi
        
        # Delete if not kept
        if [[ "${keep}" == "false" ]]; then
            log_message "Removing old backup: ${backup} (${days_old} days old)"
            aws s3 rm "${s3_bucket}/${backup}"
            
            if [[ $? -eq 0 ]]; then
                ((removed_count++))
            fi
        fi
    done
    
    unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
    
    log_message "Retention policy applied: ${removed_count} old backups removed"
    echo ${removed_count}
}

# Function: verify_backups
# Description: Verifies the integrity of created backups
# Parameters:
#   $1: database_backup_path - Path to the database backup
#   $2: wal_archive_path - Path to the WAL archive
#   $3: blob_backup_path - Path to the blob storage backup
# Returns:
#   JSON object with verification results for each backup type
verify_backups() {
    local database_backup_path="$1"
    local wal_archive_path="$2"
    local blob_backup_path="$3"
    local verification_results="{}"
    
    log_message "Verifying backup integrity..."
    
    # Verify database backup
    if [[ -f "${database_backup_path}" ]]; then
        local db_verify_dir="${BACKUP_DIR}/verify/db"
        mkdir -p "${db_verify_dir}"
        
        log_message "Verifying database backup integrity..."
        gunzip -c "${database_backup_path}" | pg_restore --list > "${db_verify_dir}/db_backup_contents.txt"
        
        if [[ $? -eq 0 ]]; then
            verification_results=$(echo "${verification_results}" | jq '.database="success"')
            log_message "Database backup verification successful"
        else
            verification_results=$(echo "${verification_results}" | jq '.database="failed"')
            log_message "ERROR: Database backup verification failed"
        fi
    else
        verification_results=$(echo "${verification_results}" | jq '.database="missing"')
        log_message "WARNING: Database backup file not found for verification"
    fi
    
    # Verify WAL archive
    if [[ -f "${wal_archive_path}" ]]; then
        local wal_verify_dir="${BACKUP_DIR}/verify/wal"
        mkdir -p "${wal_verify_dir}"
        
        log_message "Verifying WAL archive integrity..."
        tar -tzf "${wal_archive_path}" > /dev/null
        
        if [[ $? -eq 0 ]]; then
            verification_results=$(echo "${verification_results}" | jq '.wal="success"')
            log_message "WAL archive verification successful"
        else
            verification_results=$(echo "${verification_results}" | jq '.wal="failed"')
            log_message "ERROR: WAL archive verification failed"
        fi
    else
        verification_results=$(echo "${verification_results}" | jq '.wal="missing"')
        log_message "WARNING: WAL archive file not found for verification"
    fi
    
    # Verify blob storage backup
    if [[ -f "${blob_backup_path}" ]]; then
        local blob_verify_dir="${BACKUP_DIR}/verify/blob"
        mkdir -p "${blob_verify_dir}"
        
        log_message "Verifying blob storage backup integrity..."
        tar -tzf "${blob_backup_path}" > /dev/null
        
        if [[ $? -eq 0 ]]; then
            verification_results=$(echo "${verification_results}" | jq '.blob="success"')
            log_message "Blob storage backup verification successful"
        else
            verification_results=$(echo "${verification_results}" | jq '.blob="failed"')
            log_message "ERROR: Blob storage backup verification failed"
        fi
    else
        verification_results=$(echo "${verification_results}" | jq '.blob="missing"')
        log_message "WARNING: Blob storage backup file not found for verification"
    fi
    
    echo "${verification_results}"
}

# Function: cleanup_local_backups
# Description: Removes temporary local backup files after successful upload
# Returns:
#   true if cleanup successful, false otherwise
cleanup_local_backups() {
    log_message "Cleaning up local backup files..."
    
    # Check if the backup directory exists
    if [[ ! -d "${BACKUP_DIR}" ]]; then
        log_message "Backup directory does not exist, nothing to clean up"
        return 0
    fi
    
    # Remove backup files but preserve logs
    rm -rf "${BACKUP_DIR}/database"
    rm -rf "${BACKUP_DIR}/wal"
    rm -rf "${BACKUP_DIR}/blob"
    rm -rf "${BACKUP_DIR}/verify"
    
    # Remove parent directory if empty
    if [[ -z "$(ls -A "${BACKUP_DIR}")" ]]; then
        rmdir "${BACKUP_DIR}"
    fi
    
    log_message "Local backup files cleaned up successfully"
    return 0
}

# Function: send_notification
# Description: Sends backup completion notification
# Parameters:
#   $1: status - Success or failure status
#   $2: details - Detailed information about the backup
send_notification() {
    local status="$1"
    local details="$2"
    
    log_message "Sending backup ${status} notification..."
    
    # Format notification message
    local subject="Revolucare Backup: ${status} (${ENVIRONMENT})"
    local message="Revolucare Backup ${TIMESTAMP}\n"
    message+="Status: ${status}\n"
    message+="Environment: ${ENVIRONMENT}\n"
    message+="Details: ${details}\n"
    message+="Log File: ${LOG_FILE}\n"
    
    # Send email notification using AWS SES
    if command -v aws &> /dev/null; then
        echo -e "${message}" | aws ses send-email \
            --from "alerts@revolucare.com" \
            --to "devops@revolucare.com" \
            --subject "${subject}" \
            --text "${message}" \
            --region us-east-1 &>/dev/null
        
        if [[ $? -ne 0 ]]; then
            log_message "WARNING: Failed to send email notification"
        else
            log_message "Email notification sent successfully"
        fi
    else
        log_message "WARNING: AWS CLI not available, skipping email notification"
    fi
    
    # Send additional alert for failures
    if [[ "${status}" == "FAILURE" ]]; then
        # Implement additional alerting here (e.g., PagerDuty, Slack, etc.)
        log_message "Sending additional failure alerts..."
    fi
}

# Function: main
# Description: Main function that orchestrates the backup process
# Returns:
#   Exit code (0 for success, non-zero for failure)
main() {
    local exit_code=0
    local start_time=$(date +%s)
    local database_backup_path=""
    local wal_archive_path=""
    local blob_backup_path=""
    
    log_message "=== Revolucare Backup Started (Environment: ${ENVIRONMENT}) ==="
    log_message "Timestamp: ${TIMESTAMP}"
    
    # Check dependencies
    check_dependencies
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Dependency check failed, aborting backup"
        send_notification "FAILURE" "Dependency check failed"
        return 2
    fi
    
    # Load environment-specific configuration
    if [[ -f "${CONFIG_FILE}" ]]; then
        log_message "Loading configuration from ${CONFIG_FILE}"
        source <(jq -r "to_entries|map(\"export \(.key)=\(.value|tostring)\")|.[]" "${CONFIG_FILE}")
    fi
    
    # Create backup directories
    create_backup_directories
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Failed to create backup directories, aborting backup"
        send_notification "FAILURE" "Failed to create backup directories"
        return 1
    fi
    
    # Perform database backup
    database_backup_path=$(backup_database)
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Database backup failed"
        exit_code=3
    fi
    
    # Archive WAL logs
    wal_archive_path=$(backup_wal_logs)
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: WAL archiving failed"
        exit_code=4
    fi
    
    # Backup blob storage
    blob_backup_path=$(backup_blob_storage)
    if [[ $? -ne 0 ]]; then
        log_message "ERROR: Blob storage backup failed"
        exit_code=5
    fi
    
    # Verify backup integrity
    local verification_results=$(verify_backups "${database_backup_path}" "${wal_archive_path}" "${blob_backup_path}")
    local db_verification=$(echo "${verification_results}" | jq -r '.database')
    local wal_verification=$(echo "${verification_results}" | jq -r '.wal')
    local blob_verification=$(echo "${verification_results}" | jq -r '.blob')
    
    if [[ "${db_verification}" != "success" || "${wal_verification}" != "success" || "${blob_verification}" != "success" ]]; then
        log_message "ERROR: Backup verification failed"
        exit_code=7
    fi
    
    # Upload backups to S3
    if [[ -f "${database_backup_path}" ]]; then
        upload_to_s3 "${database_backup_path}" "s3://${BACKUP_BUCKET}/${ENVIRONMENT}/database"
        if [[ $? -ne 0 ]]; then
            log_message "ERROR: Failed to upload database backup to S3"
            exit_code=6
        fi
    fi
    
    if [[ -f "${wal_archive_path}" ]]; then
        upload_to_s3 "${wal_archive_path}" "s3://${BACKUP_BUCKET}/${ENVIRONMENT}/wal"
        if [[ $? -ne 0 ]]; then
            log_message "ERROR: Failed to upload WAL archive to S3"
            exit_code=6
        fi
    fi
    
    if [[ -f "${blob_backup_path}" ]]; then
        upload_to_s3 "${blob_backup_path}" "s3://${BACKUP_BUCKET}/${ENVIRONMENT}/blob"
        if [[ $? -ne 0 ]]; then
            log_message "ERROR: Failed to upload blob storage backup to S3"
            exit_code=6
        fi
    fi
    
    # Apply retention policy
    local removed_count=$(apply_retention_policy)
    
    # Cleanup local backup files
    cleanup_local_backups
    
    # Calculate duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    local duration_formatted=$(printf "%02d:%02d:%02d" $((duration/3600)) $((duration%3600/60)) $((duration%60)))
    
    # Send completion notification
    if [[ ${exit_code} -eq 0 ]]; then
        log_message "=== Revolucare Backup Completed Successfully ==="
        log_message "Backup Duration: ${duration_formatted}"
        send_notification "SUCCESS" "All backup operations completed successfully. Duration: ${duration_formatted}"
    else
        log_message "=== Revolucare Backup Completed with Errors (Code: ${exit_code}) ==="
        log_message "Backup Duration: ${duration_formatted}"
        send_notification "FAILURE" "Backup failed with exit code ${exit_code}. Duration: ${duration_formatted}"
    fi
    
    return ${exit_code}
}

# Parse command line arguments
if [[ $# -gt 0 ]]; then
    ENVIRONMENT="$1"
fi

# Call main function
main
exit $?