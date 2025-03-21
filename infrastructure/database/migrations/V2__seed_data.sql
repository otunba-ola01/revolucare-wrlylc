-- Revolucare Platform - Initial Data Seed
-- This migration seeds the database with initial data for the Revolucare platform.

-- Seed Users - Create initial users with different roles
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_verified, created_at, updated_at)
VALUES
  (uuid_generate_v4(), 'admin@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'ADMINISTRATOR', 'James', 'Wilson', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'casemanager@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'CASE_MANAGER', 'Michael', 'Brown', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'provider@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'PROVIDER', 'Elena', 'Rodriguez', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'client@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'CLIENT', 'Sarah', 'Johnson', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'provider2@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'PROVIDER', 'James', 'Lee', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (uuid_generate_v4(), 'client2@revolucare.com', '$2a$12$1InE4AoCzx8BPrSQZJEYVeH1qQZnLUjYnmJsZJ/Qxx0J5ZFHmJ5.6', 'CLIENT', 'Robert', 'Davis', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create variables to store user IDs for reference in other tables
DO $$
DECLARE
  admin_id UUID;
  case_manager_id UUID;
  provider_id UUID;
  provider2_id UUID;
  client_id UUID;
  client2_id UUID;
  case_manager_profile_id UUID;
  client_profile_id UUID;
  client2_profile_id UUID;
  provider_profile_id UUID;
  provider2_profile_id UUID;
  medical_history_id UUID;
  medication_list_id UUID;
  needs_assessment_id UUID;
  needs_assessment2_id UUID;
  care_plan_id UUID;
  care_plan2_id UUID;
  services_plan_id UUID;
  services_plan2_id UUID;
  service_item_id UUID;
  service_item2_id UUID;
  service_item3_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO admin_id FROM users WHERE email = 'admin@revolucare.com';
  SELECT id INTO case_manager_id FROM users WHERE email = 'casemanager@revolucare.com';
  SELECT id INTO provider_id FROM users WHERE email = 'provider@revolucare.com';
  SELECT id INTO provider2_id FROM users WHERE email = 'provider2@revolucare.com';
  SELECT id INTO client_id FROM users WHERE email = 'client@revolucare.com';
  SELECT id INTO client2_id FROM users WHERE email = 'client2@revolucare.com';

  -- Seed Admin Profiles - Create profiles for administrator users
  INSERT INTO admin_profiles (id, user_id, department, permissions, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    admin_id,
    'System Administration',
    '{"manage_users": true, "manage_system": true, "view_analytics": true}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

  -- Seed Case Manager Profiles - Create profiles for case manager users
  INSERT INTO case_manager_profiles (id, user_id, certification, specialty, bio, assigned_clients, created_at, updated_at)
  VALUES (
    uuid_generate_v4(),
    case_manager_id,
    'Certified Case Manager (CCM)',
    'Disability Services',
    'Experienced case manager specializing in coordinating care for individuals with disabilities.',
    '{}'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Get case manager profile ID
  SELECT id INTO case_manager_profile_id FROM case_manager_profiles WHERE user_id = case_manager_id;

  -- Seed Client Profiles - Create profiles for client users
  INSERT INTO client_profiles (id, user_id, date_of_birth, gender, address, phone, emergency_contact, medical_information, insurance, preferences, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_id,
      '1988-05-12',
      'Female',
      '{"street": "123 Main Street", "city": "Springfield", "state": "IL", "zipCode": "62704", "country": "USA"}'::jsonb,
      '(555) 123-4567',
      '{"name": "John Johnson", "relationship": "Spouse", "phone": "(555) 987-6543"}'::jsonb,
      '{"conditions": ["Multiple Sclerosis", "Chronic Fatigue", "Mild Depression"], "allergies": ["Penicillin", "Sulfa drugs"], "medications": [{"name": "Tecfidera", "dosage": "240mg", "frequency": "twice daily"}, {"name": "Baclofen", "dosage": "10mg", "frequency": "three times daily"}, {"name": "Vitamin D", "dosage": "2000IU", "frequency": "once daily"}]}'::jsonb,
      '{"provider": "Blue Cross Blue Shield", "policyNumber": "BCBS12345678", "groupNumber": "GRP987654", "policyHolder": "Sarah Johnson"}'::jsonb,
      '{"communicationPreference": "email", "appointmentReminders": true, "languagePreference": "English"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      client2_id,
      '1975-09-23',
      'Male',
      '{"street": "456 Oak Avenue", "city": "Springfield", "state": "IL", "zipCode": "62704", "country": "USA"}'::jsonb,
      '(555) 234-5678',
      '{"name": "Mary Davis", "relationship": "Spouse", "phone": "(555) 876-5432"}'::jsonb,
      '{"conditions": ["Spinal Cord Injury", "Hypertension"], "allergies": ["Latex"], "medications": [{"name": "Lisinopril", "dosage": "10mg", "frequency": "once daily"}, {"name": "Baclofen", "dosage": "20mg", "frequency": "three times daily"}]}'::jsonb,
      '{"provider": "Aetna", "policyNumber": "AET87654321", "groupNumber": "GRP123456", "policyHolder": "Robert Davis"}'::jsonb,
      '{"communicationPreference": "phone", "appointmentReminders": true, "languagePreference": "English"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
  -- Get client profile IDs
  SELECT id INTO client_profile_id FROM client_profiles WHERE user_id = client_id;
  SELECT id INTO client2_profile_id FROM client_profiles WHERE user_id = client2_id;

  -- Seed Provider Profiles - Create profiles for provider users
  INSERT INTO provider_profiles (id, user_id, organization_name, license_number, license_expiration, service_types, bio, specializations, insurance_accepted, average_rating, review_count, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      provider_id,
      'Rodriguez Rehabilitation Services',
      'PT12345',
      '2025-12-31',
      ARRAY['PHYSICAL_THERAPY', 'OCCUPATIONAL_THERAPY'],
      'Specialized rehabilitation services for individuals with neurological conditions and mobility challenges.',
      ARRAY['Neurological Rehabilitation', 'Mobility Training', 'Strength and Conditioning'],
      ARRAY['Blue Cross Blue Shield', 'Aetna', 'Medicare', 'Medicaid'],
      4.8,
      42,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider2_id,
      'Lee Speech & Language Therapy',
      'SLP54321',
      '2024-10-15',
      ARRAY['SPEECH_THERAPY', 'BEHAVIORAL_THERAPY'],
      'Dedicated speech and language therapy services for individuals with communication disorders and cognitive challenges.',
      ARRAY['Speech Rehabilitation', 'Language Development', 'Cognitive Communication'],
      ARRAY['Blue Cross Blue Shield', 'United Healthcare', 'Medicare', 'Medicaid'],
      4.6,
      28,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
  -- Get provider profile IDs
  SELECT id INTO provider_profile_id FROM provider_profiles WHERE user_id = provider_id;
  SELECT id INTO provider2_profile_id FROM provider_profiles WHERE user_id = provider2_id;

  -- Seed Case Manager Clients - Assign clients to case managers
  INSERT INTO case_manager_clients (id, case_manager_id, client_id, assigned_at, notes)
  VALUES
    (
      uuid_generate_v4(),
      case_manager_profile_id,
      client_profile_id,
      CURRENT_TIMESTAMP,
      'Primary case manager for client''s MS care coordination.'
    ),
    (
      uuid_generate_v4(),
      case_manager_profile_id,
      client2_profile_id,
      CURRENT_TIMESTAMP,
      'Primary case manager for client''s spinal cord injury care coordination.'
    );

  -- Seed Documents - Create sample documents for users
  INSERT INTO documents (id, owner_id, name, type, mime_type, size, storage_url, metadata, status, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_id,
      'Medical History.pdf',
      'medical_record',
      'application/pdf',
      1024567,
      'https://storage.revolucare.com/documents/medical_history_123.pdf',
      '{"title": "Medical History", "description": "Complete medical history for Sarah Johnson", "tags": ["medical", "history", "MS"], "documentDate": "2023-01-15", "isConfidential": true}'::jsonb,
      'AVAILABLE',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      client_id,
      'Medication List.pdf',
      'medical_record',
      'application/pdf',
      512345,
      'https://storage.revolucare.com/documents/medication_list_123.pdf',
      '{"title": "Medication List", "description": "Current medications for Sarah Johnson", "tags": ["medications", "prescriptions"], "documentDate": "2023-02-10", "isConfidential": true}'::jsonb,
      'AVAILABLE',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      client2_id,
      'Spinal Injury Assessment.pdf',
      'assessment',
      'application/pdf',
      2048123,
      'https://storage.revolucare.com/documents/spinal_assessment_456.pdf',
      '{"title": "Spinal Injury Assessment", "description": "Comprehensive assessment of spinal cord injury", "tags": ["assessment", "spinal", "injury"], "documentDate": "2023-03-05", "isConfidential": true}'::jsonb,
      'AVAILABLE',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider_id,
      'PT License.pdf',
      'provider_credential',
      'application/pdf',
      768234,
      'https://storage.revolucare.com/documents/pt_license_789.pdf',
      '{"title": "Physical Therapy License", "description": "Professional license for Elena Rodriguez", "tags": ["license", "credential", "PT"], "documentDate": "2022-12-01", "isConfidential": true}'::jsonb,
      'AVAILABLE',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
  -- Get document IDs
  SELECT id INTO medical_history_id FROM documents WHERE name = 'Medical History.pdf';
  SELECT id INTO medication_list_id FROM documents WHERE name = 'Medication List.pdf';

  -- Seed Document Analysis - Create analysis results for documents
  INSERT INTO document_analysis (id, document_id, analysis_type, status, results, confidence, processing_time, created_at, completed_at)
  VALUES
    (
      uuid_generate_v4(),
      medical_history_id,
      'medical_extraction',
      'COMPLETED',
      '{"conditions": ["Multiple Sclerosis", "Chronic Fatigue", "Mild Depression"], "diagnosisDate": "2018-03-15", "allergies": ["Penicillin", "Sulfa drugs"], "procedures": [{"name": "MRI Brain", "date": "2022-11-10"}], "providers": [{"name": "Dr. Smith", "specialty": "Neurology"}]}'::jsonb,
      0.92,
      12345,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      medication_list_id,
      'medical_extraction',
      'COMPLETED',
      '{"medications": [{"name": "Tecfidera", "dosage": "240mg", "frequency": "twice daily", "purpose": "MS Treatment"}, {"name": "Baclofen", "dosage": "10mg", "frequency": "three times daily", "purpose": "Muscle Spasticity"}, {"name": "Vitamin D", "dosage": "2000IU", "frequency": "once daily", "purpose": "Supplement"}]}'::jsonb,
      0.95,
      8765,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

  -- Seed Needs Assessments - Create needs assessments for clients
  INSERT INTO needs_assessments (id, client_id, assessment_data, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_profile_id,
      '{"mobilityNeeds": {"assistanceLevel": "moderate", "mobilityAids": ["cane"], "transferAssistance": "minimal"}, "adlNeeds": {"bathing": "independent", "dressing": "minimal assistance", "toileting": "independent", "eating": "independent"}, "healthNeeds": {"medicationManagement": "needs reminders", "woundCare": "not applicable", "painManagement": "moderate need"}, "cognitiveNeeds": {"memoryImpairment": "mild", "problemSolving": "intact", "communication": "intact"}, "emotionalNeeds": {"moodSupport": "moderate need", "anxietyManagement": "moderate need", "socialIsolation": "significant concern"}, "environmentalNeeds": {"homeModifications": ["bathroom grab bars", "non-slip surfaces"], "accessibilityIssues": ["stairs"]}, "servicePreferences": {"preferredTimes": ["morning", "afternoon"], "frequencyPreference": "2-3 times per week", "genderPreference": "female"}}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      client2_profile_id,
      '{"mobilityNeeds": {"assistanceLevel": "maximum", "mobilityAids": ["wheelchair"], "transferAssistance": "maximum"}, "adlNeeds": {"bathing": "maximum assistance", "dressing": "maximum assistance", "toileting": "moderate assistance", "eating": "minimal assistance"}, "healthNeeds": {"medicationManagement": "needs setup", "woundCare": "pressure ulcer prevention", "painManagement": "significant need"}, "cognitiveNeeds": {"memoryImpairment": "none", "problemSolving": "intact", "communication": "intact"}, "emotionalNeeds": {"moodSupport": "moderate need", "anxietyManagement": "minimal need", "socialIsolation": "moderate concern"}, "environmentalNeeds": {"homeModifications": ["wheelchair ramps", "widened doorways", "roll-in shower"], "accessibilityIssues": ["bathroom access"]}, "servicePreferences": {"preferredTimes": ["morning", "evening"], "frequencyPreference": "daily", "genderPreference": "no preference"}}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
    
  -- Get needs assessment IDs
  SELECT id INTO needs_assessment_id FROM needs_assessments WHERE client_id = client_profile_id;
  SELECT id INTO needs_assessment2_id FROM needs_assessments WHERE client_id = client2_profile_id;

  -- Seed Care Plans - Create care plans for clients
  INSERT INTO care_plans (id, client_id, created_by_id, title, description, status, confidence_score, version, previous_version_id, approved_by_id, approved_at, approval_notes, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_profile_id,
      case_manager_id,
      'Multiple Sclerosis Management Plan',
      'Comprehensive care plan for managing Multiple Sclerosis symptoms and improving quality of life.',
      'ACTIVE',
      0.95,
      1,
      NULL,
      case_manager_id,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      'Plan addresses all identified needs with appropriate interventions.',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      client2_profile_id,
      case_manager_id,
      'Spinal Cord Injury Management Plan',
      'Comprehensive care plan for managing spinal cord injury and maximizing independence.',
      'ACTIVE',
      0.92,
      1,
      NULL,
      case_manager_id,
      CURRENT_TIMESTAMP - INTERVAL '5 days',
      'Plan addresses mobility, self-care, and psychosocial needs.',
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '5 days'
    );
    
  -- Get care plan IDs
  SELECT id INTO care_plan_id FROM care_plans WHERE client_id = client_profile_id;
  SELECT id INTO care_plan2_id FROM care_plans WHERE client_id = client2_profile_id;

  -- Seed Care Plan Goals - Create goals for care plans
  INSERT INTO care_plan_goals (id, care_plan_id, description, target_date, status, measures, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      care_plan_id,
      'Improve mobility and balance',
      CURRENT_DATE + INTERVAL '3 months',
      'IN_PROGRESS',
      ARRAY['Timed Up and Go Test', 'Berg Balance Scale', 'Daily step count'],
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan_id,
      'Reduce fatigue symptoms',
      CURRENT_DATE + INTERVAL '2 months',
      'IN_PROGRESS',
      ARRAY['Fatigue Severity Scale', 'Activity log', 'Self-reported energy levels'],
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan_id,
      'Improve overall quality of life',
      CURRENT_DATE + INTERVAL '6 months',
      'IN_PROGRESS',
      ARRAY['Quality of Life Assessment', 'Depression screening', 'Participation in social activities'],
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      'Increase upper body strength',
      CURRENT_DATE + INTERVAL '4 months',
      'IN_PROGRESS',
      ARRAY['Manual muscle testing', 'Functional reach test', 'Transfer ability assessment'],
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      'Prevent pressure injuries',
      CURRENT_DATE + INTERVAL '1 month',
      'IN_PROGRESS',
      ARRAY['Skin assessment', 'Pressure relief frequency', 'Tissue integrity'],
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    );

  -- Seed Care Plan Interventions - Create interventions for care plans
  INSERT INTO care_plan_interventions (id, care_plan_id, description, frequency, duration, responsible_party, status, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      care_plan_id,
      'Physical Therapy sessions focusing on balance, coordination, and strength',
      '2 times per week',
      '12 weeks',
      'Physical Therapist',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan_id,
      'Occupational Therapy for energy conservation techniques',
      '1 time per week',
      '8 weeks',
      'Occupational Therapist',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan_id,
      'Medication management review',
      'Monthly',
      'Ongoing',
      'Neurologist',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan_id,
      'MS Support Group participation',
      'Weekly',
      'Ongoing',
      'Client',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      'Physical Therapy for upper body strengthening',
      '3 times per week',
      '16 weeks',
      'Physical Therapist',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      'Pressure relief education and monitoring',
      'Daily',
      'Ongoing',
      'Home Health Aide',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      'Wheelchair mobility training',
      '2 times per week',
      '8 weeks',
      'Occupational Therapist',
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '7 days',
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    );

  -- Seed Care Plan Versions - Create version history for care plans
  INSERT INTO care_plan_versions (id, care_plan_id, version, data, changes, created_at)
  VALUES
    (
      uuid_generate_v4(),
      care_plan_id,
      1,
      '{"title": "Multiple Sclerosis Management Plan", "description": "Comprehensive care plan for managing Multiple Sclerosis symptoms and improving quality of life.", "status": "ACTIVE", "goals": ["Improve mobility and balance", "Reduce fatigue symptoms", "Improve overall quality of life"], "interventions": ["Physical Therapy sessions", "Occupational Therapy", "Medication management review", "MS Support Group participation"]}'::jsonb,
      NULL,
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      care_plan2_id,
      1,
      '{"title": "Spinal Cord Injury Management Plan", "description": "Comprehensive care plan for managing spinal cord injury and maximizing independence.", "status": "ACTIVE", "goals": ["Increase upper body strength", "Prevent pressure injuries"], "interventions": ["Physical Therapy for upper body strengthening", "Pressure relief education and monitoring", "Wheelchair mobility training"]}'::jsonb,
      NULL,
      CURRENT_TIMESTAMP - INTERVAL '7 days'
    );

  -- Seed Services Plans - Create service plans for clients
  INSERT INTO services_plans (id, client_id, care_plan_id, needs_assessment_id, created_by_id, title, description, status, estimated_cost, approved_by_id, approved_at, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_profile_id,
      care_plan_id,
      needs_assessment_id,
      case_manager_id,
      'MS Rehabilitation Services Plan',
      'Service plan implementing the MS Management Care Plan with specific providers and schedules.',
      'ACTIVE',
      4500.0,
      case_manager_id,
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
      uuid_generate_v4(),
      client2_profile_id,
      care_plan2_id,
      needs_assessment2_id,
      case_manager_id,
      'Spinal Cord Injury Services Plan',
      'Service plan implementing the Spinal Cord Injury Management Care Plan with specific providers and schedules.',
      'ACTIVE',
      6800.0,
      case_manager_id,
      CURRENT_TIMESTAMP - INTERVAL '4 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '4 days'
    );
    
  -- Get services plan IDs
  SELECT id INTO services_plan_id FROM services_plans WHERE client_id = client_profile_id;
  SELECT id INTO services_plan2_id FROM services_plans WHERE client_id = client2_profile_id;

  -- Seed Service Items - Create service items for service plans
  INSERT INTO service_items (id, services_plan_id, service_type, provider_id, description, frequency, duration, estimated_cost, status, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      services_plan_id,
      'PHYSICAL_THERAPY',
      provider_profile_id,
      'Physical therapy sessions focusing on balance, coordination, and strength training',
      '2 sessions per week',
      '60 minutes per session for 12 weeks',
      2400.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      services_plan_id,
      'OCCUPATIONAL_THERAPY',
      provider_profile_id,
      'Occupational therapy for energy conservation techniques and daily living activities',
      '1 session per week',
      '60 minutes per session for 8 weeks',
      800.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      services_plan_id,
      'SUPPORT_GROUP',
      NULL,
      'MS Support Group participation',
      'Weekly',
      '90 minutes per session, ongoing',
      0.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'PHYSICAL_THERAPY',
      provider_profile_id,
      'Physical therapy for upper body strengthening and mobility',
      '3 sessions per week',
      '60 minutes per session for 16 weeks',
      4800.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'HOME_HEALTH_AIDE',
      NULL,
      'Home health aide for personal care and pressure injury prevention',
      'Daily',
      '2 hours per day, ongoing',
      1400.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'SPEECH_THERAPY',
      provider2_profile_id,
      'Speech therapy for cognitive communication strategies',
      '1 session per week',
      '45 minutes per session for 8 weeks',
      600.0,
      'ACTIVE',
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    );
    
  -- Get service item IDs
  SELECT id INTO service_item_id FROM service_items WHERE services_plan_id = services_plan_id AND service_type = 'PHYSICAL_THERAPY';
  SELECT id INTO service_item2_id FROM service_items WHERE services_plan_id = services_plan2_id AND service_type = 'PHYSICAL_THERAPY';
  SELECT id INTO service_item3_id FROM service_items WHERE services_plan_id = services_plan2_id AND service_type = 'SPEECH_THERAPY';

  -- Seed Funding Sources - Create funding sources for service plans
  INSERT INTO funding_sources (id, services_plan_id, name, type, coverage_percentage, coverage_amount, verification_status, details, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      services_plan_id,
      'Blue Cross Blue Shield',
      'INSURANCE',
      80.0,
      3600.0,
      'VERIFIED',
      '{"policyNumber": "BCBS12345678", "groupNumber": "GRP987654", "authorizationNumber": "AUTH123456", "authorizationDate": "2023-05-01", "contactPerson": "Jane Smith", "contactPhone": "(555) 123-4567"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      services_plan_id,
      'Client Payment',
      'PRIVATE_PAY',
      20.0,
      900.0,
      'VERIFIED',
      '{"paymentMethod": "Credit Card", "billingFrequency": "Monthly", "billingContact": "Sarah Johnson"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'Aetna',
      'INSURANCE',
      70.0,
      4760.0,
      'VERIFIED',
      '{"policyNumber": "AET87654321", "groupNumber": "GRP123456", "authorizationNumber": "AUTH654321", "authorizationDate": "2023-05-03", "contactPerson": "John Doe", "contactPhone": "(555) 987-6543"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'Disability Grant',
      'GRANT',
      20.0,
      1360.0,
      'VERIFIED',
      '{"grantName": "Community Accessibility Fund", "grantNumber": "CAF2023-456", "approvalDate": "2023-05-02", "expirationDate": "2023-12-31", "contactPerson": "Mark Wilson", "contactPhone": "(555) 456-7890"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    ),
    (
      uuid_generate_v4(),
      services_plan2_id,
      'Client Payment',
      'PRIVATE_PAY',
      10.0,
      680.0,
      'VERIFIED',
      '{"paymentMethod": "Bank Transfer", "billingFrequency": "Monthly", "billingContact": "Robert Davis"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '6 days',
      CURRENT_TIMESTAMP - INTERVAL '6 days'
    );

  -- Seed Service Areas - Create service areas for providers
  INSERT INTO service_areas (id, provider_id, location, radius, address, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      provider_profile_id,
      '{"latitude": 39.78373, "longitude": -89.65063}'::jsonb,
      25.0,
      '{"street": "789 Health Avenue", "city": "Springfield", "state": "IL", "zipCode": "62701", "country": "USA"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider2_profile_id,
      '{"latitude": 39.76843, "longitude": -89.68756}'::jsonb,
      20.0,
      '{"street": "456 Therapy Lane", "city": "Springfield", "state": "IL", "zipCode": "62702", "country": "USA"}'::jsonb,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

  -- Seed Provider Availability - Create availability slots for providers
  INSERT INTO provider_availability (id, provider_id, start_time, end_time, is_recurring, recurrence_pattern, is_available, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      provider_profile_id,
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours',
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '17 hours',
      TRUE,
      '{"frequency": "weekly", "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "endDate": null}'::jsonb,
      TRUE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider_profile_id,
      CURRENT_DATE + INTERVAL '3 days' + INTERVAL '9 hours',
      CURRENT_DATE + INTERVAL '3 days' + INTERVAL '12 hours',
      FALSE,
      NULL,
      FALSE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider2_profile_id,
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours',
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours',
      TRUE,
      '{"frequency": "weekly", "days": ["Monday", "Wednesday", "Friday"], "endDate": null}'::jsonb,
      TRUE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ),
    (
      uuid_generate_v4(),
      provider2_profile_id,
      CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours',
      CURRENT_DATE + INTERVAL '2 days' + INTERVAL '18 hours',
      TRUE,
      '{"frequency": "weekly", "days": ["Tuesday", "Thursday"], "endDate": null}'::jsonb,
      TRUE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

  -- Seed Provider Reviews - Create reviews for providers
  INSERT INTO provider_reviews (id, provider_id, client_id, rating, comment, service_date, is_verified, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      provider_profile_id,
      client_profile_id,
      5.0,
      'Dr. Rodriguez is an excellent physical therapist who really understands MS. She has helped me improve my balance and strength significantly.',
      CURRENT_DATE - INTERVAL '30 days',
      TRUE,
      CURRENT_TIMESTAMP - INTERVAL '25 days',
      CURRENT_TIMESTAMP - INTERVAL '25 days'
    ),
    (
      uuid_generate_v4(),
      provider_profile_id,
      client2_profile_id,
      4.5,
      'Very knowledgeable about spinal cord injuries and rehabilitation techniques. The exercises have been very helpful for building my upper body strength.',
      CURRENT_DATE - INTERVAL '15 days',
      TRUE,
      CURRENT_TIMESTAMP - INTERVAL '12 days',
      CURRENT_TIMESTAMP - INTERVAL '12 days'
    ),
    (
      uuid_generate_v4(),
      provider2_profile_id,
      client2_profile_id,
      4.5,
      'Dr. Lee is a skilled speech therapist who has helped me with cognitive strategies. Very patient and supportive.',
      CURRENT_DATE - INTERVAL '10 days',
      TRUE,
      CURRENT_TIMESTAMP - INTERVAL '8 days',
      CURRENT_TIMESTAMP - INTERVAL '8 days'
    );

  -- Seed Bookings - Create service appointments
  INSERT INTO bookings (id, client_id, provider_id, service_item_id, start_time, end_time, status, notes, cancellation_reason, location, created_at, updated_at)
  VALUES
    (
      uuid_generate_v4(),
      client_profile_id,
      provider_profile_id,
      service_item_id,
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours',
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '15 hours',
      'SCHEDULED',
      'Focus on balance exercises and gait training.',
      NULL,
      '{"type": "provider_office", "address": "789 Health Avenue, Springfield, IL 62701"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      client_profile_id,
      provider_profile_id,
      service_item_id,
      CURRENT_DATE + INTERVAL '4 days' + INTERVAL '14 hours',
      CURRENT_DATE + INTERVAL '4 days' + INTERVAL '15 hours',
      'SCHEDULED',
      'Continue with balance exercises and start strength training.',
      NULL,
      '{"type": "provider_office", "address": "789 Health Avenue, Springfield, IL 62701"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      client2_profile_id,
      provider_profile_id,
      service_item2_id,
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours',
      CURRENT_DATE + INTERVAL '1 day' + INTERVAL '11 hours',
      'SCHEDULED',
      'Upper body strengthening exercises.',
      NULL,
      '{"type": "provider_office", "address": "789 Health Avenue, Springfield, IL 62701"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '5 days',
      CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
      uuid_generate_v4(),
      client2_profile_id,
      provider2_profile_id,
      service_item3_id,
      CURRENT_DATE + INTERVAL '2 days' + INTERVAL '13 hours',
      CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours',
      'SCHEDULED',
      'Cognitive communication strategies session.',
      NULL,
      '{"type": "provider_office", "address": "456 Therapy Lane, Springfield, IL 62702"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '5 days',
      CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
      uuid_generate_v4(),
      client_profile_id,
      provider_profile_id,
      service_item_id,
      CURRENT_DATE - INTERVAL '30 days' + INTERVAL '14 hours',
      CURRENT_DATE - INTERVAL '30 days' + INTERVAL '15 hours',
      'COMPLETED',
      'Initial assessment and baseline measurements. Client showed good engagement with exercises.',
      NULL,
      '{"type": "provider_office", "address": "789 Health Avenue, Springfield, IL 62701"}'::jsonb,
      CURRENT_TIMESTAMP - INTERVAL '35 days',
      CURRENT_TIMESTAMP - INTERVAL '29 days'
    );

  -- Seed Notifications - Create notifications for users
  INSERT INTO notifications (id, user_id, type, title, message, data, priority, channels, status, created_at, sent_at, read_at)
  VALUES
    (
      uuid_generate_v4(),
      client_id,
      'APPOINTMENT_REMINDER',
      'Upcoming Appointment Reminder',
      'You have a Physical Therapy appointment tomorrow at 2:00 PM with Dr. Rodriguez.',
      format('{"appointmentId": "%s", "providerName": "Elena Rodriguez", "serviceType": "Physical Therapy", "location": "789 Health Avenue, Springfield, IL 62701"}', service_item_id)::jsonb,
      'NORMAL',
      ARRAY['IN_APP', 'EMAIL'],
      'SENT',
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      NULL
    ),
    (
      uuid_generate_v4(),
      client_id,
      'CARE_PLAN_UPDATE',
      'Care Plan Approved',
      'Your Multiple Sclerosis Management Plan has been approved and is now active.',
      format('{"carePlanId": "%s", "approvedBy": "Michael Brown", "approvalDate": "2023-05-10"}', care_plan_id)::jsonb,
      'HIGH',
      ARRAY['IN_APP', 'EMAIL'],
      'SENT',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      provider_id,
      'NEW_BOOKING',
      'New Appointment Scheduled',
      'Sarah Johnson has scheduled a Physical Therapy appointment for tomorrow at 2:00 PM.',
      format('{"appointmentId": "%s", "clientName": "Sarah Johnson", "serviceType": "Physical Therapy", "location": "789 Health Avenue, Springfield, IL 62701"}', service_item_id)::jsonb,
      'NORMAL',
      ARRAY['IN_APP', 'EMAIL'],
      'SENT',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      case_manager_id,
      'CARE_PLAN_CREATED',
      'Care Plan Created',
      'You have created a new care plan for Sarah Johnson: Multiple Sclerosis Management Plan.',
      format('{"carePlanId": "%s", "clientName": "Sarah Johnson", "creationDate": "2023-05-09"}', care_plan_id)::jsonb,
      'NORMAL',
      ARRAY['IN_APP'],
      'SENT',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      client2_id,
      'APPOINTMENT_REMINDER',
      'Upcoming Appointment Reminder',
      'You have a Speech Therapy appointment tomorrow at 1:00 PM with Dr. Lee.',
      format('{"appointmentId": "%s", "providerName": "James Lee", "serviceType": "Speech Therapy", "location": "456 Therapy Lane, Springfield, IL 62702"}', service_item3_id)::jsonb,
      'NORMAL',
      ARRAY['IN_APP', 'EMAIL', 'SMS'],
      'SENT',
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      CURRENT_TIMESTAMP - INTERVAL '1 day',
      NULL
    );

  -- Seed Audit Logs - Create audit logs for system actions
  INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at)
  VALUES
    (
      uuid_generate_v4(),
      case_manager_id,
      'CREATE',
      'CARE_PLAN',
      care_plan_id,
      format('{"title": "Multiple Sclerosis Management Plan", "clientId": "%s", "status": "DRAFT"}', client_profile_id)::jsonb,
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
      uuid_generate_v4(),
      case_manager_id,
      'UPDATE',
      'CARE_PLAN',
      care_plan_id,
      format('{"status": {"from": "DRAFT", "to": "ACTIVE"}, "approvedById": "%s", "approvedAt": "2023-05-10T14:30:00Z"}', case_manager_id)::jsonb,
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      case_manager_id,
      'CREATE',
      'SERVICES_PLAN',
      services_plan_id,
      format('{"title": "MS Rehabilitation Services Plan", "clientId": "%s", "carePlanId": "%s", "status": "DRAFT"}', client_profile_id, care_plan_id)::jsonb,
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      case_manager_id,
      'UPDATE',
      'SERVICES_PLAN',
      services_plan_id,
      format('{"status": {"from": "DRAFT", "to": "ACTIVE"}, "approvedById": "%s", "approvedAt": "2023-05-11T10:15:00Z"}', case_manager_id)::jsonb,
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
      uuid_generate_v4(),
      client_id,
      'CREATE',
      'BOOKING',
      NULL,
      format('{"serviceItemId": "%s", "providerId": "%s", "startTime": "2023-05-15T14:00:00Z", "endTime": "2023-05-15T15:00:00Z"}', service_item_id, provider_profile_id)::jsonb,
      '192.168.1.101',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
      uuid_generate_v4(),
      provider_id,
      'UPDATE',
      'PROVIDER_AVAILABILITY',
      NULL,
      '{"action": "update_recurring_schedule", "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "startTime": "09:00:00", "endTime": "17:00:00"}'::jsonb,
      '192.168.1.102',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      CURRENT_TIMESTAMP - INTERVAL '5 days'
    );
END $$;

-- Initial data seed complete