#!/bin/bash
# Revolucare Platform - Database Seeding Script
# This script initializes the Revolucare database with sample data for development, testing, and demonstration purposes.
# It orchestrates the seeding process by executing SQL migrations and TypeScript seed scripts to populate the database with users, profiles, care plans, service plans, and other essential records.

# Script Usage:
# ./seed-data.sh [--clear] [--schema] [environment]
#
# Options:
#   --clear: Clear existing data before seeding
#   --schema: Execute schema creation script before seeding
#   environment: Deployment environment (dev, staging, prod)

# Required Environment Variables:
#   DB_HOST - Database hostname
#   DB_PORT - Database port
#   DB_NAME - Database name
#   DB_USER - Database username
#   DB_PASSWORD - Database password

# Internal Imports:
#   V1__initial_schema.sql - References the database schema that must be created before seeding data
#   V2__seed_data.sql - Contains SQL statements to populate the database with sample data
#   seed.ts - TypeScript seed script that uses Prisma ORM to populate the database with sample data

# External Dependencies:
#   psql (postgresql-client) - PostgreSQL client for executing SQL scripts
#   node (nodejs 18.x) - Node.js runtime for executing TypeScript seed scripts
#   npx (npm) - NPM package runner for executing Prisma commands

# Script Directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Log File
LOG_FILE="$SCRIPT_DIR/seed-data.log"

# Function to log messages to both stdout and the log file
log_message() {
  local message="$1"
  local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
  local log_message="[$timestamp] $message"
  echo "$log_message"
  echo "$log_message" >> "$LOG_FILE"
}

# Function to check if required dependencies are installed
check_dependencies() {
  log_message "Checking dependencies..."

  # Check for psql command
  if ! command -v psql &> /dev/null; then
    log_message "Error: psql command not found. Please install postgresql-client."
    return 1
  fi

  # Check for node command
  if ! command -v node &> /dev/null; then
    log_message "Error: node command not found. Please install Node.js (version 18.x)."
    return 1
  fi

  # Check for npx command
  if ! command -v npx &> /dev/null; then
    log_message "Error: npx command not found. Please install npm."
    return 1
  fi

  # Check for required environment variables
  if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log_message "Error: Required environment variables are missing (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD)."
    return 1
  fi

  log_message "All dependencies are available."
  return 0
}

# Function to load environment-specific configuration
load_environment() {
  log_message "Loading environment configuration..."

  # Determine environment from ENVIRONMENT variable or default to 'dev'
  ENVIRONMENT="${ENVIRONMENT:-dev}"
  log_message "Using environment: $ENVIRONMENT"

  # Load environment-specific .env file (if it exists)
  if [ -f "$SCRIPT_DIR/.env.$ENVIRONMENT" ]; then
    log_message "Loading .env.$ENVIRONMENT"
    export $(grep -v '^#' "$SCRIPT_DIR/.env.$ENVIRONMENT" | xargs)
  fi

  # Set database connection variables
  DB_HOST="${DB_HOST}"
  DB_PORT="${DB_PORT}"
  DB_NAME="${DB_NAME}"
  DB_USER="${DB_USER}"
  DB_PASSWORD="${DB_PASSWORD}"

  # Validate required variables are set
  if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    log_message "Error: Required database environment variables are missing."
    return 1
  fi

  log_message "Environment configuration loaded."
  return 0
}

# Function to execute a SQL script against the database
execute_sql_script() {
  local script_path="$1"

  log_message "Executing SQL script: $script_path"

  # Check if script file exists
  if [ ! -f "$script_path" ]; then
    log_message "Error: SQL script not found: $script_path"
    return 1
  fi

  # Use psql to execute the script against the database
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$script_path" -v ON_ERROR_STOP=1 > /dev/null 2>&1

  local status=$?

  # Check execution status
  if [ "$status" -ne 0 ]; then
    log_message "Error: Failed to execute SQL script: $script_path"
    return 1
  else
    log_message "SQL script executed successfully: $script_path"
    return 0
  fi
}

# Function to execute the Prisma TypeScript seed script
execute_prisma_seed() {
  log_message "Executing Prisma seed script..."

  # Navigate to backend directory
  cd "$SCRIPT_DIR/../../src/backend" || {
    log_message "Error: Could not navigate to backend directory."
    return 1
  }

  # Run npx prisma db seed command
  npx prisma db seed > /dev/null 2>&1

  local status=$?

  # Check execution status
  if [ "$status" -ne 0 ]; then
    log_message "Error: Failed to execute Prisma seed script."
    return 1
  else
    log_message "Prisma seed script executed successfully."
    return 0
  fi
}

# Function to check database connection
check_database_connection() {
  log_message "Checking database connection..."

  # Attempt to connect to the database using psql
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1

  local status=$?

  # Check connection status
  if [ "$status" -ne 0 ]; then
    log_message "Error: Failed to connect to the database."
    return 1
  else
    log_message "Successfully connected to the database."
    return 0
  fi
}

# Function to clear existing data from the database
clear_database() {
  log_message "Clearing existing data from the database..."

  # Generate SQL to truncate all tables in the correct order
  local truncate_sql=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "
  SELECT string_agg(format('TRUNCATE TABLE %s CASCADE;', quote_ident(tablename)), E'\n')
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename != 'spatial_ref_sys';"
  )

  # Execute the truncate statements
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$truncate_sql" > /dev/null 2>&1

  local status=$?

  # Check execution status
  if [ "$status" -ne 0 ]; then
    log_message "Error: Failed to clear existing data from the database."
    return 1
  else
    log_message "Successfully cleared existing data from the database."
    return 0
  fi
}

# Function to verify that seed data was properly inserted
verify_seed_data() {
  log_message "Verifying seed data..."

  # Query database for counts of key entities
  local user_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM users;")
  local client_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM client_profiles;")
  local provider_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM provider_profiles;")
  local care_plan_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM care_plans;")
  local service_plan_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM services_plans;")
  local document_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -At -c "SELECT COUNT(*) FROM documents;")

  # Log verification results
  log_message "User count: $user_count"
  log_message "Client profile count: $client_count"
  log_message "Provider profile count: $provider_count"
  log_message "Care plan count: $care_plan_count"
  log_message "Service plan count: $service_plan_count"
  log_message "Document count: $document_count"

  # Return verification results object
  echo "{
    \"users\": $user_count,
    \"clients\": $client_count,
    \"providers\": $provider_count,
    \"care_plans\": $care_plan_count,
    \"service_plans\": $service_plan_count,
    \"documents\": $document_count
  }"
}

# Main function that orchestrates the seeding process
main() {
  local start_time=$(date +%s)
  local clear_data=0
  local execute_schema=0

  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --clear)
        clear_data=1
        shift
        ;;
      --schema)
        execute_schema=1
        shift
        ;;
      *)
        ENVIRONMENT="$1"
        shift
        ;;
    esac
  done

  # Initialize script and log start time
  log_message "Starting Revolucare database seeding..."

  # Check dependencies
  if ! check_dependencies; then
    exit 2
  fi

  # Load environment configuration
  if ! load_environment; then
    exit 2
  fi

  # Check database connection
  if ! check_database_connection; then
    exit 3
  fi

  # Clear existing data if requested
  if [ "$clear_data" -eq 1 ]; then
    if ! clear_database; then
      exit 4
    fi
  fi

  # Execute initial schema SQL script if requested
  if [ "$execute_schema" -eq 1 ]; then
    if ! execute_sql_script "$SCRIPT_DIR/../database/migrations/V1__initial_schema.sql"; then
      exit 4
    fi
  fi

  # Execute seed data SQL script
  if ! execute_sql_script "$SCRIPT_DIR/../database/migrations/V2__seed_data.sql"; then
    exit 5
  fi

  # Execute Prisma seed script
  if ! execute_prisma_seed; then
    exit 6
  fi

  # Verify seed data
  verify_seed_data_result=$(verify_seed_data)
  if [ -z "$verify_seed_data_result" ]; then
    log_message "Error: Seed data verification failed."
    exit 7
  else
    log_message "Seed data verification successful."
  fi

  # Log completion and exit
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  log_message "Revolucare database seeding completed in $duration seconds."

  exit 0
}

# Run main function
main "$@"