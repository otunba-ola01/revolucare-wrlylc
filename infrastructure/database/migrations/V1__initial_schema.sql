-- Revolucare Platform - Initial Schema Migration
-- This migration creates the initial database schema for the Revolucare platform.

-- Enable UUID generation functions for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('CLIENT', 'PROVIDER', 'CASE_MANAGER', 'ADMINISTRATOR');
CREATE TYPE plan_status AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE goal_status AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'DISCONTINUED');
CREATE TYPE intervention_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'DISCONTINUED');
CREATE TYPE service_status AS ENUM ('PENDING', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'DISCONTINUED');
CREATE TYPE booking_status AS ENUM ('SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE document_status AS ENUM ('UPLOADING', 'PROCESSING', 'AVAILABLE', 'ERROR');
CREATE TYPE analysis_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');
CREATE TYPE notification_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE verification_status AS ENUM ('PENDING', 'VERIFIED', 'DENIED');
CREATE TYPE funding_type AS ENUM ('INSURANCE', 'MEDICAID', 'MEDICARE', 'PRIVATE_PAY', 'GRANT', 'OTHER');

-- Create users table - Core user accounts with authentication details
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_role_idx ON users(role);

-- Create client_profiles table - Extended profile for CLIENT role users
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(50),
    address JSONB,
    phone VARCHAR(50),
    emergency_contact JSONB,
    medical_information JSONB,
    insurance JSONB,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX client_user_id_idx ON client_profiles(user_id);

-- Create provider_profiles table - Extended profile for PROVIDER role users
CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    license_expiration DATE,
    service_types VARCHAR(100)[] NOT NULL,
    bio TEXT,
    specializations VARCHAR(100)[] NOT NULL DEFAULT '{}'::VARCHAR(100)[],
    insurance_accepted VARCHAR(100)[] NOT NULL DEFAULT '{}'::VARCHAR(100)[],
    average_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX provider_user_id_idx ON provider_profiles(user_id);
CREATE INDEX provider_org_name_idx ON provider_profiles(organization_name);
CREATE INDEX provider_service_types_idx ON provider_profiles USING GIN(service_types);

-- Create case_manager_profiles table - Extended profile for CASE_MANAGER role users
CREATE TABLE case_manager_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    certification VARCHAR(255),
    specialty VARCHAR(255),
    bio TEXT,
    assigned_clients JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX case_manager_user_id_idx ON case_manager_profiles(user_id);

-- Create admin_profiles table - Extended profile for ADMINISTRATOR role users
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(255),
    permissions JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX admin_user_id_idx ON admin_profiles(user_id);

-- Create case_manager_clients table - Junction table for case manager to client assignments
CREATE TABLE case_manager_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_manager_id UUID NOT NULL REFERENCES case_manager_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    CONSTRAINT unique_case_manager_client UNIQUE (case_manager_id, client_id)
);

CREATE INDEX case_manager_clients_cm_id_idx ON case_manager_clients(case_manager_id);
CREATE INDEX case_manager_clients_client_id_idx ON case_manager_clients(client_id);

-- Create documents table - Store metadata for uploaded documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    storage_url VARCHAR(1024) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    status document_status NOT NULL DEFAULT 'UPLOADING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX document_owner_id_idx ON documents(owner_id);
CREATE INDEX document_type_idx ON documents(type);
CREATE INDEX document_status_idx ON documents(status);
CREATE INDEX document_metadata_idx ON documents USING GIN(metadata);

-- Create document_analysis table - Store results of AI analysis on documents
CREATE TABLE document_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    status analysis_status NOT NULL DEFAULT 'PENDING',
    results JSONB NOT NULL DEFAULT '{}'::JSONB,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
    processing_time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX document_analysis_document_id_idx ON document_analysis(document_id);
CREATE INDEX document_analysis_analysis_type_idx ON document_analysis(analysis_type);
CREATE INDEX document_analysis_status_idx ON document_analysis(status);

-- Create needs_assessments table - Store client needs assessment data
CREATE TABLE needs_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    assessment_data JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX needs_assessment_client_id_idx ON needs_assessments(client_id);

-- Create care_plans table - Store care plans for clients
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    created_by_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status plan_status NOT NULL DEFAULT 'DRAFT',
    confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id UUID,
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX care_plan_client_id_idx ON care_plans(client_id);
CREATE INDEX care_plan_created_by_idx ON care_plans(created_by_id);
CREATE INDEX care_plan_status_idx ON care_plans(status);

-- Create care_plan_goals table - Store goals within care plans
CREATE TABLE care_plan_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    target_date DATE,
    status goal_status NOT NULL DEFAULT 'PENDING',
    measures VARCHAR(255)[] NOT NULL DEFAULT '{}'::VARCHAR(255)[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX care_plan_goal_care_plan_id_idx ON care_plan_goals(care_plan_id);
CREATE INDEX care_plan_goal_status_idx ON care_plan_goals(status);

-- Create care_plan_interventions table - Store interventions within care plans
CREATE TABLE care_plan_interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    frequency VARCHAR(255) NOT NULL,
    duration VARCHAR(255) NOT NULL,
    responsible_party VARCHAR(255) NOT NULL,
    status intervention_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX care_plan_intervention_care_plan_id_idx ON care_plan_interventions(care_plan_id);
CREATE INDEX care_plan_intervention_status_idx ON care_plan_interventions(status);

-- Create care_plan_versions table - Store version history of care plans
CREATE TABLE care_plan_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_care_plan_version UNIQUE (care_plan_id, version)
);

CREATE INDEX care_plan_version_care_plan_id_idx ON care_plan_versions(care_plan_id);
CREATE INDEX care_plan_version_version_idx ON care_plan_versions(version);

-- Create services_plans table - Store service plans for implementing care plans
CREATE TABLE services_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    care_plan_id UUID REFERENCES care_plans(id),
    needs_assessment_id UUID REFERENCES needs_assessments(id),
    created_by_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status plan_status NOT NULL DEFAULT 'DRAFT',
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    approved_by_id UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX services_plan_client_id_idx ON services_plans(client_id);
CREATE INDEX services_plan_care_plan_id_idx ON services_plans(care_plan_id);
CREATE INDEX services_plan_status_idx ON services_plans(status);

-- Create service_items table - Store individual services within service plans
CREATE TABLE service_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    services_plan_id UUID NOT NULL REFERENCES services_plans(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    provider_id UUID REFERENCES provider_profiles(id),
    description TEXT NOT NULL,
    frequency VARCHAR(255) NOT NULL,
    duration VARCHAR(255) NOT NULL,
    estimated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    status service_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_item_services_plan_id_idx ON service_items(services_plan_id);
CREATE INDEX service_item_provider_id_idx ON service_items(provider_id);
CREATE INDEX service_item_service_type_idx ON service_items(service_type);
CREATE INDEX service_item_status_idx ON service_items(status);

-- Create funding_sources table - Store funding sources for service plans
CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    services_plan_id UUID NOT NULL REFERENCES services_plans(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type funding_type NOT NULL,
    coverage_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    coverage_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    verification_status verification_status NOT NULL DEFAULT 'PENDING',
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX funding_source_services_plan_id_idx ON funding_sources(services_plan_id);
CREATE INDEX funding_source_type_idx ON funding_sources(type);
CREATE INDEX funding_source_verification_status_idx ON funding_sources(verification_status);

-- Create service_areas table - Store geographic service areas for providers
CREATE TABLE service_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    location JSONB NOT NULL,
    radius DECIMAL(8,2) NOT NULL,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX service_area_provider_id_idx ON service_areas(provider_id);

-- Create provider_availability table - Store availability slots for providers
CREATE TABLE provider_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_pattern JSONB,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_availability_times CHECK (end_time > start_time)
);

CREATE INDEX provider_availability_provider_id_idx ON provider_availability(provider_id);
CREATE INDEX provider_availability_start_time_idx ON provider_availability(start_time);
CREATE INDEX provider_availability_end_time_idx ON provider_availability(end_time);
CREATE INDEX provider_availability_is_available_idx ON provider_availability(is_available);

-- Create provider_reviews table - Store reviews and ratings for providers
CREATE TABLE provider_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL,
    comment TEXT,
    service_date DATE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_rating_range CHECK (rating >= 1.0 AND rating <= 5.0),
    CONSTRAINT unique_client_provider_review UNIQUE (client_id, provider_id)
);

CREATE INDEX provider_review_provider_id_idx ON provider_reviews(provider_id);
CREATE INDEX provider_review_client_id_idx ON provider_reviews(client_id);
CREATE INDEX provider_review_rating_idx ON provider_reviews(rating);

-- Create bookings table - Store service appointments
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    service_item_id UUID REFERENCES service_items(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status booking_status NOT NULL DEFAULT 'SCHEDULED',
    notes TEXT,
    cancellation_reason TEXT,
    location JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_booking_times CHECK (end_time > start_time)
);

CREATE INDEX booking_client_id_idx ON bookings(client_id);
CREATE INDEX booking_provider_id_idx ON bookings(provider_id);
CREATE INDEX booking_service_item_id_idx ON bookings(service_item_id);
CREATE INDEX booking_start_time_idx ON bookings(start_time);
CREATE INDEX booking_status_idx ON bookings(status);

-- Create notifications table - Store user notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    priority notification_priority NOT NULL DEFAULT 'NORMAL',
    channels VARCHAR(50)[] NOT NULL DEFAULT '{"IN_APP"}'::VARCHAR(50)[],
    status notification_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX notification_user_id_idx ON notifications(user_id);
CREATE INDEX notification_type_idx ON notifications(type);
CREATE INDEX notification_status_idx ON notifications(status);
CREATE INDEX notification_priority_idx ON notifications(priority);

-- Create audit_logs table - Store system audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX audit_log_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_log_action_idx ON audit_logs(action);
CREATE INDEX audit_log_entity_type_idx ON audit_logs(entity_type);
CREATE INDEX audit_log_entity_id_idx ON audit_logs(entity_id);
CREATE INDEX audit_log_created_at_idx ON audit_logs(created_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER client_profiles_updated_at
BEFORE UPDATE ON client_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER provider_profiles_updated_at
BEFORE UPDATE ON provider_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER case_manager_profiles_updated_at
BEFORE UPDATE ON case_manager_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER admin_profiles_updated_at
BEFORE UPDATE ON admin_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER needs_assessments_updated_at
BEFORE UPDATE ON needs_assessments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER care_plans_updated_at
BEFORE UPDATE ON care_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER care_plan_goals_updated_at
BEFORE UPDATE ON care_plan_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER care_plan_interventions_updated_at
BEFORE UPDATE ON care_plan_interventions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER services_plans_updated_at
BEFORE UPDATE ON services_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_items_updated_at
BEFORE UPDATE ON service_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER funding_sources_updated_at
BEFORE UPDATE ON funding_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER service_areas_updated_at
BEFORE UPDATE ON service_areas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER provider_availability_updated_at
BEFORE UPDATE ON provider_availability
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER provider_reviews_updated_at
BEFORE UPDATE ON provider_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function for updating provider ratings
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE provider_profiles
    SET average_rating = (
        SELECT AVG(rating)
        FROM provider_reviews
        WHERE provider_id = NEW.provider_id
    ),
    review_count = (
        SELECT COUNT(*)
        FROM provider_reviews
        WHERE provider_id = NEW.provider_id
    )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER provider_reviews_update_rating
AFTER INSERT OR UPDATE OR DELETE ON provider_reviews
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- Create indexes for full-text search
CREATE INDEX users_full_text_idx ON users USING GIN (
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, ''))
);

CREATE INDEX provider_profiles_full_text_idx ON provider_profiles USING GIN (
    to_tsvector('english', COALESCE(organization_name, '') || ' ' || COALESCE(bio, '') || ' ' || array_to_string(specializations, ' '))
);

CREATE INDEX documents_full_text_idx ON documents USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(type, '') || ' ' || COALESCE(metadata->>'title', '') || ' ' || COALESCE(metadata->>'description', '') || ' ' || COALESCE(array_to_string((metadata->>'tags')::text[], ' '), ''))
);

-- Create function for audit logging
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_details JSONB,
    p_ip_address VARCHAR,
    p_user_agent VARCHAR
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs(user_id, action, entity_type, entity_id, details, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_details, p_ip_address, p_user_agent)
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Initial schema migration complete