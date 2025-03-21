import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import { Config } from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as fs from 'fs'; // fs built-in
import * as path from 'path'; // path built-in
import { NetworkOutputs } from './networking';

/**
 * Interface for security infrastructure outputs
 */
export interface SecurityOutputs {
    /**
     * Map of IAM role ARNs by role name
     */
    iamRoleArns: Record<string, string>;
    
    /**
     * Map of KMS key ARNs by key name
     */
    kmsKeyArns: Record<string, string>;
    
    /**
     * Map of certificate ARNs by domain name
     */
    certificateArns: Record<string, string>;
    
    /**
     * ARN of the WAF Web ACL
     */
    wafAclArn: string;
    
    /**
     * Map of Secrets Manager secret ARNs by secret name
     */
    secretArns: Record<string, string>;
    
    /**
     * ID of the GuardDuty detector
     */
    guardDutyDetectorId: string;
    
    /**
     * ID of the AWS Config recorder
     */
    configRecorderId: string;
    
    /**
     * ID of the Shield protection (if enabled)
     */
    shieldProtectionId?: string;
}

/**
 * Interface for security infrastructure creation options
 */
export interface SecurityOptions {
    /**
     * Deployment environment (dev, staging, prod)
     */
    environment: string;
    
    /**
     * Outputs from the network infrastructure creation
     */
    networkOutputs: NetworkOutputs;
    
    /**
     * ARN of the Application Load Balancer for WAF association
     */
    loadBalancerArn: string;
    
    /**
     * Domain names for SSL certificates
     */
    domainNames: string[];
    
    /**
     * SNS topic for security alerts
     */
    alertTopic: aws.sns.Topic;
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for IAM role configuration
 */
interface IamRoleConfig {
    /**
     * Name of the IAM role
     */
    name: string;
    
    /**
     * Description of the role's purpose
     */
    description: string;
    
    /**
     * Trust relationship policy document
     */
    assumeRolePolicy: string;
    
    /**
     * ARNs of managed policies to attach
     */
    managedPolicyArns: string[];
    
    /**
     * Inline policy documents by name
     */
    inlinePolicies: Record<string, string>;
}

/**
 * Interface for KMS key configuration
 */
interface KmsKeyConfig {
    /**
     * Name of the KMS key
     */
    name: string;
    
    /**
     * Description of the key's purpose
     */
    description: string;
    
    /**
     * Whether to enable automatic key rotation
     */
    enableKeyRotation: boolean;
    
    /**
     * Key policy document
     */
    policy: string;
    
    /**
     * Alias for the key
     */
    alias: string;
}

/**
 * Interface for WAF rule configuration
 */
interface WafRuleConfig {
    /**
     * Name of the WAF rule
     */
    name: string;
    
    /**
     * Priority of the rule (lower numbers evaluated first)
     */
    priority: number;
    
    /**
     * Action to take (Allow, Block, Count)
     */
    action: string;
    
    /**
     * Rule statement configuration
     */
    statement: any;
    
    /**
     * Visibility configuration for the rule
     */
    visibilityConfig: {
        sampledRequestsEnabled: boolean;
        cloudWatchMetricsEnabled: boolean;
        metricName: string;
    };
}

/**
 * Interface for secret configuration
 */
interface SecretConfig {
    /**
     * Name of the secret
     */
    name: string;
    
    /**
     * Description of the secret's purpose
     */
    description: string;
    
    /**
     * Secret value as JSON object
     */
    secretValue: Record<string, string>;
    
    /**
     * ID of the KMS key for encryption
     */
    kmsKeyId: string;
    
    /**
     * Whether to enable automatic rotation
     */
    rotationEnabled: boolean;
    
    /**
     * ARN of the rotation Lambda function
     */
    rotationLambdaArn?: string;
}

/**
 * Creates and configures all security infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the security infrastructure
 * @returns SecurityOutputs containing references to created security resources
 */
export function createSecurityInfrastructure(options: SecurityOptions): SecurityOutputs {
    const {
        environment,
        networkOutputs,
        loadBalancerArn,
        domainNames,
        alertTopic,
        tags,
    } = options;
    
    // Create IAM roles for different service components
    const iamRoles = createIamRoles(environment, tags);
    
    // Create KMS keys for data encryption
    const kmsKeys = createKmsKeys(environment, iamRoles, tags);
    
    // Configure AWS WAF with security rules
    const wafAcl = createWafConfiguration(environment, loadBalancerArn, tags);
    
    // Create and validate SSL certificates
    const certificates = createCertificates(environment, domainNames, tags);
    
    // Set up AWS Shield for DDoS protection (production only)
    let shieldProtection: aws.shield.Protection | undefined;
    if (environment === 'prod') {
        shieldProtection = configureShieldProtection(environment, loadBalancerArn, tags);
    }
    
    // Configure AWS Config for compliance monitoring
    const configRecorder = configureAwsConfig(environment, tags);
    
    // Set up AWS GuardDuty for threat detection
    const guardDutyDetector = configureGuardDuty(environment, alertTopic, tags);
    
    // Create security policies for S3, KMS, and IAM
    const securityPolicies = createSecurityPolicies(environment, iamRoles, kmsKeys, tags);
    
    // Configure AWS Secrets Manager for sensitive configuration
    const secrets = configureSecretsManager(environment, kmsKeys, tags);
    
    // Set up security-related CloudWatch alarms
    const securityAlarms = createSecurityAlarms(environment, alertTopic, tags);
    
    // Return security infrastructure outputs
    return {
        iamRoleArns: Object.entries(iamRoles).reduce((acc, [name, role]) => {
            acc[name] = role.arn;
            return acc;
        }, {} as Record<string, string>),
        
        kmsKeyArns: Object.entries(kmsKeys).reduce((acc, [name, key]) => {
            acc[name] = key.arn;
            return acc;
        }, {} as Record<string, string>),
        
        certificateArns: Object.entries(certificates).reduce((acc, [domain, cert]) => {
            acc[domain] = cert.arn;
            return acc;
        }, {} as Record<string, string>),
        
        wafAclArn: wafAcl.arn,
        
        secretArns: Object.entries(secrets).reduce((acc, [name, secret]) => {
            acc[name] = secret.arn;
            return acc;
        }, {} as Record<string, string>),
        
        guardDutyDetectorId: guardDutyDetector.id,
        
        configRecorderId: configRecorder.id,
        
        shieldProtectionId: shieldProtection?.id,
    };
}

/**
 * Creates IAM roles for different service components with least privilege permissions
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Map of created IAM roles by name
 */
function createIamRoles(
    environment: string,
    tags: Record<string, string>
): Record<string, aws.iam.Role> {
    const roles: Record<string, aws.iam.Role> = {};
    
    // Create ECS task execution role
    roles.ecsTaskExecution = new aws.iam.Role(`${environment}-ecs-task-execution-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com",
                },
            }],
        }),
        description: "Role for ECS task execution",
        tags: {
            ...tags,
            Name: `${environment}-ecs-task-execution-role`,
        },
    });
    
    // Attach managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(`${environment}-ecs-task-execution-policy-attachment`, {
        role: roles.ecsTaskExecution.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    });
    
    // Create ECS task role
    roles.ecsTask = new aws.iam.Role(`${environment}-ecs-task-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "ecs-tasks.amazonaws.com",
                },
            }],
        }),
        description: "Role for ECS tasks",
        tags: {
            ...tags,
            Name: `${environment}-ecs-task-role`,
        },
    });
    
    // Create inline policy for ECS task role
    new aws.iam.RolePolicy(`${environment}-ecs-task-s3-policy`, {
        role: roles.ecsTask.id,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket",
                    ],
                    Resource: [
                        `arn:aws:s3:::${environment}-revolucare-*/*`,
                        `arn:aws:s3:::${environment}-revolucare-*`,
                    ],
                },
            ],
        }),
    });
    
    // Create Lambda execution role
    roles.lambda = new aws.iam.Role(`${environment}-lambda-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "lambda.amazonaws.com",
                },
            }],
        }),
        description: "Role for Lambda functions",
        tags: {
            ...tags,
            Name: `${environment}-lambda-role`,
        },
    });
    
    // Attach managed policy for Lambda basic execution
    new aws.iam.RolePolicyAttachment(`${environment}-lambda-basic-execution-policy-attachment`, {
        role: roles.lambda.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });
    
    // Create CloudWatch Events role
    roles.cloudWatchEvents = new aws.iam.Role(`${environment}-events-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "events.amazonaws.com",
                },
            }],
        }),
        description: "Role for CloudWatch Events",
        tags: {
            ...tags,
            Name: `${environment}-events-role`,
        },
    });
    
    // Create inline policy for CloudWatch Events
    new aws.iam.RolePolicy(`${environment}-events-lambda-policy`, {
        role: roles.cloudWatchEvents.id,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "lambda:InvokeFunction",
                    ],
                    Resource: "*", // This should be restricted to specific Lambda functions in production
                },
            ],
        }),
    });
    
    // Create a role for the app-specific permissions
    roles.appService = new aws.iam.Role(`${environment}-app-service-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: [
                        "ecs-tasks.amazonaws.com",
                        "lambda.amazonaws.com",
                    ],
                },
            }],
        }),
        description: "Role for application services",
        tags: {
            ...tags,
            Name: `${environment}-app-service-role`,
        },
    });
    
    // Application-specific permissions for healthcare data handling
    new aws.iam.RolePolicy(`${environment}-app-service-data-policy`, {
        role: roles.appService.id,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Allow S3 access for document storage
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket",
                        "s3:DeleteObject",
                    ],
                    Resource: [
                        `arn:aws:s3:::${environment}-revolucare-documents/*`,
                        `arn:aws:s3:::${environment}-revolucare-documents`,
                    ],
                },
                // Allow SQS access for message processing
                {
                    Effect: "Allow",
                    Action: [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes",
                    ],
                    Resource: `arn:aws:sqs:*:*:${environment}-revolucare-*`,
                },
                // Allow SNS publish for notifications
                {
                    Effect: "Allow",
                    Action: [
                        "sns:Publish",
                    ],
                    Resource: `arn:aws:sns:*:*:${environment}-revolucare-*`,
                },
                // Allow CloudWatch Logs creation
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    Resource: "arn:aws:logs:*:*:*",
                },
            ],
        }),
    });
    
    return roles;
}

/**
 * Creates KMS keys for encrypting sensitive data with appropriate key policies
 * 
 * @param environment Deployment environment name
 * @param iamRoles IAM roles that need access to the keys
 * @param tags Resource tags to apply
 * @returns Map of created KMS keys by name
 */
function createKmsKeys(
    environment: string,
    iamRoles: Record<string, aws.iam.Role>,
    tags: Record<string, string>
): Record<string, aws.kms.Key> {
    const keys: Record<string, aws.kms.Key> = {};
    
    // Get AWS account ID
    const current = aws.getCallerIdentity({});
    const accountId = current.then(current => current.accountId);
    
    // Create KMS key for database encryption
    keys.database = new aws.kms.Key(`${environment}-db-key`, {
        description: `KMS key for ${environment} database encryption`,
        enableKeyRotation: true,
        policy: accountId.then(accountId => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Allow root user full access
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                // Allow ECS task role to use the key
                {
                    Sid: "Allow ECS Task Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.ecsTask.arn,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                // Allow app service role to use the key
                {
                    Sid: "Allow App Service Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.appService.arn,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
            ],
        })),
        tags: {
            ...tags,
            Name: `${environment}-db-key`,
            Purpose: "Database Encryption",
        },
    });
    
    // Create alias for database key
    new aws.kms.Alias(`${environment}-db-key-alias`, {
        name: `alias/${environment}-revolucare-db`,
        targetKeyId: keys.database.keyId,
    });
    
    // Create KMS key for S3 encryption
    keys.s3 = new aws.kms.Key(`${environment}-s3-key`, {
        description: `KMS key for ${environment} S3 bucket encryption`,
        enableKeyRotation: true,
        policy: accountId.then(accountId => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Allow root user full access
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                // Allow ECS task role to use the key
                {
                    Sid: "Allow ECS Task Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.ecsTask.arn,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                // Allow Lambda role to use the key
                {
                    Sid: "Allow Lambda Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.lambda.arn,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                // Allow app service role to use the key
                {
                    Sid: "Allow App Service Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.appService.arn,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
            ],
        })),
        tags: {
            ...tags,
            Name: `${environment}-s3-key`,
            Purpose: "S3 Bucket Encryption",
        },
    });
    
    // Create alias for S3 key
    new aws.kms.Alias(`${environment}-s3-key-alias`, {
        name: `alias/${environment}-revolucare-s3`,
        targetKeyId: keys.s3.keyId,
    });
    
    // Create KMS key for Secrets Manager
    keys.secrets = new aws.kms.Key(`${environment}-secrets-key`, {
        description: `KMS key for ${environment} Secrets Manager encryption`,
        enableKeyRotation: true,
        policy: accountId.then(accountId => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Allow root user full access
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                // Allow ECS task role to use the key
                {
                    Sid: "Allow ECS Task Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.ecsTask.arn,
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                // Allow Lambda role to use the key
                {
                    Sid: "Allow Lambda Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.lambda.arn,
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                // Allow app service role to use the key
                {
                    Sid: "Allow App Service Role to use the key",
                    Effect: "Allow",
                    Principal: {
                        AWS: iamRoles.appService.arn,
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
            ],
        })),
        tags: {
            ...tags,
            Name: `${environment}-secrets-key`,
            Purpose: "Secrets Manager Encryption",
        },
    });
    
    // Create alias for Secrets Manager key
    new aws.kms.Alias(`${environment}-secrets-key-alias`, {
        name: `alias/${environment}-revolucare-secrets`,
        targetKeyId: keys.secrets.keyId,
    });
    
    // Create KMS key for CloudWatch Logs
    keys.logs = new aws.kms.Key(`${environment}-logs-key`, {
        description: `KMS key for ${environment} CloudWatch Logs encryption`,
        enableKeyRotation: true,
        policy: accountId.then(accountId => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                // Allow root user full access
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                // Allow CloudWatch Logs to use the key
                {
                    Sid: "Allow CloudWatch Logs to use the key",
                    Effect: "Allow",
                    Principal: {
                        Service: "logs.amazonaws.com",
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                    Condition: {
                        ArnLike: {
                            "kms:EncryptionContext:aws:logs:arn": `arn:aws:logs:*:${accountId}:log-group:*`,
                        },
                    },
                },
            ],
        })),
        tags: {
            ...tags,
            Name: `${environment}-logs-key`,
            Purpose: "CloudWatch Logs Encryption",
        },
    });
    
    // Create alias for CloudWatch Logs key
    new aws.kms.Alias(`${environment}-logs-key-alias`, {
        name: `alias/${environment}-revolucare-logs`,
        targetKeyId: keys.logs.keyId,
    });
    
    return keys;
}

/**
 * Creates AWS WAF configuration with security rules for web application protection
 * 
 * @param environment Deployment environment name
 * @param loadBalancerArn ARN of the load balancer to associate with WAF
 * @param tags Resource tags to apply
 * @returns Created WAF Web ACL
 */
function createWafConfiguration(
    environment: string,
    loadBalancerArn: string,
    tags: Record<string, string>
): aws.wafv2.WebAcl {
    // Create WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(`${environment}-waf-web-acl`, {
        description: `Web ACL for ${environment} environment`,
        scope: "REGIONAL",
        defaultAction: {
            allow: {},
        },
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `${environment}-waf-web-acl`,
            sampledRequestsEnabled: true,
        },
        rules: [
            // AWS Managed Rules - Core rule set
            {
                name: "AWS-AWSManagedRulesCommonRuleSet",
                priority: 1,
                overrideAction: {
                    none: {},
                },
                statement: {
                    managedRuleGroupStatement: {
                        name: "AWSManagedRulesCommonRuleSet",
                        vendorName: "AWS",
                    },
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: `${environment}-waf-aws-common-rule-set`,
                    sampledRequestsEnabled: true,
                },
            },
            // AWS Managed Rules - Known bad inputs
            {
                name: "AWS-AWSManagedRulesKnownBadInputsRuleSet",
                priority: 2,
                overrideAction: {
                    none: {},
                },
                statement: {
                    managedRuleGroupStatement: {
                        name: "AWSManagedRulesKnownBadInputsRuleSet",
                        vendorName: "AWS",
                    },
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: `${environment}-waf-aws-known-bad-inputs`,
                    sampledRequestsEnabled: true,
                },
            },
            // AWS Managed Rules - SQL database
            {
                name: "AWS-AWSManagedRulesSQLiRuleSet",
                priority: 3,
                overrideAction: {
                    none: {},
                },
                statement: {
                    managedRuleGroupStatement: {
                        name: "AWSManagedRulesSQLiRuleSet",
                        vendorName: "AWS",
                    },
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: `${environment}-waf-aws-sql-rule-set`,
                    sampledRequestsEnabled: true,
                },
            },
            // AWS Managed Rules - Linux operating system
            {
                name: "AWS-AWSManagedRulesLinuxRuleSet",
                priority: 4,
                overrideAction: {
                    none: {},
                },
                statement: {
                    managedRuleGroupStatement: {
                        name: "AWSManagedRulesLinuxRuleSet",
                        vendorName: "AWS",
                    },
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: `${environment}-waf-aws-linux-rule-set`,
                    sampledRequestsEnabled: true,
                },
            },
            // Rate limiting rule - prevents brute force attacks
            {
                name: "RateLimitRule",
                priority: 5,
                action: {
                    block: {},
                },
                statement: {
                    rateBasedStatement: {
                        limit: 2000,
                        aggregateKeyType: "IP",
                    },
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: `${environment}-waf-rate-limit`,
                    sampledRequestsEnabled: true,
                },
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-waf-web-acl`,
        },
    });
    
    // Associate WAF Web ACL with the load balancer
    new aws.wafv2.WebAclAssociation(`${environment}-waf-web-acl-association`, {
        resourceArn: loadBalancerArn,
        webAclArn: webAcl.arn,
    });
    
    // Create logging configuration for WAF
    const s3LoggingBucket = new aws.s3.Bucket(`${environment}-waf-logs`, {
        acl: "private",
        forceDestroy: true,
        versioning: {
            enabled: true,
        },
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                },
            },
        },
        tags: {
            ...tags,
            Name: `${environment}-waf-logs`,
        },
    });
    
    // Add bucket policy for WAF logging
    new aws.s3.BucketPolicy(`${environment}-waf-logs-policy`, {
        bucket: s3LoggingBucket.id,
        policy: s3LoggingBucket.arn.apply(arn => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "AllowWAFLogging",
                    Effect: "Allow",
                    Principal: {
                        Service: "delivery.logs.amazonaws.com",
                    },
                    Action: "s3:PutObject",
                    Resource: `${arn}/*`,
                },
                {
                    Sid: "AllowSSLRequestsOnly",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        arn,
                        `${arn}/*`,
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false",
                        },
                    },
                },
            ],
        })),
    });
    
    // Enable WAF logging
    new aws.wafv2.LoggingConfiguration(`${environment}-waf-logging`, {
        resourceArn: webAcl.arn,
        logDestinationConfigs: [s3LoggingBucket.arn],
        redactedFields: [
            {
                singleHeader: {
                    name: "authorization",
                },
            },
            {
                singleHeader: {
                    name: "cookie",
                },
            },
        ],
    });
    
    return webAcl;
}

/**
 * Creates and validates SSL certificates for domain names
 * 
 * @param environment Deployment environment name
 * @param domainNames Domain names for SSL certificates
 * @param tags Resource tags to apply
 * @returns Map of created certificates by domain
 */
function createCertificates(
    environment: string,
    domainNames: string[],
    tags: Record<string, string>
): Record<string, aws.acm.Certificate> {
    const certificates: Record<string, aws.acm.Certificate> = {};
    
    // Create Route53 Hosted Zone lookup (assuming zones already exist)
    const getZones = domainNames.map(domain => {
        // Extract root domain (e.g., example.com from app.example.com)
        const rootDomain = domain.split('.').slice(-2).join('.');
        return aws.route53.getZone({ name: rootDomain });
    });
    
    // Create certificates for each domain
    for (let i = 0; i < domainNames.length; i++) {
        const domain = domainNames[i];
        
        // Create certificate with DNS validation
        const certificate = new aws.acm.Certificate(`${environment}-certificate-${i}`, {
            domainName: domain,
            // Add wildcard subdomain
            subjectAlternativeNames: [`*.${domain}`],
            validationMethod: "DNS",
            tags: {
                ...tags,
                Name: `${environment}-certificate-${domain}`,
                Domain: domain,
            },
        });
        
        // Create DNS validation records
        const hostedZoneId = getZones[i].then(zone => zone.zoneId);
        
        const validationRecord = new aws.route53.Record(`${environment}-certificate-validation-${i}`, {
            name: certificate.domainValidationOptions[0].resourceRecordName,
            zoneId: hostedZoneId,
            type: certificate.domainValidationOptions[0].resourceRecordType,
            records: [certificate.domainValidationOptions[0].resourceRecordValue],
            ttl: 60,
        });
        
        // Create certificate validation
        const certificateValidation = new aws.acm.CertificateValidation(`${environment}-certificate-validation-result-${i}`, {
            certificateArn: certificate.arn,
            validationRecordFqdns: [validationRecord.fqdn],
        });
        
        certificates[domain] = certificate;
    }
    
    return certificates;
}

/**
 * Configures AWS Shield for DDoS protection in production environment
 * 
 * @param environment Deployment environment name
 * @param loadBalancerArn ARN of the load balancer to protect
 * @param tags Resource tags to apply
 * @returns Created Shield protection
 */
function configureShieldProtection(
    environment: string,
    loadBalancerArn: string,
    tags: Record<string, string>
): aws.shield.Protection {
    // Check if environment is production (Shield Advanced is costly)
    if (environment !== 'prod') {
        throw new Error("Shield Advanced should only be enabled in production environment due to cost");
    }
    
    // Create Shield protection for the load balancer
    const protection = new aws.shield.Protection(`${environment}-shield-protection`, {
        name: `${environment}-load-balancer-protection`,
        resourceArn: loadBalancerArn,
        tags: {
            ...tags,
            Name: `${environment}-shield-protection`,
        },
    });
    
    return protection;
}

/**
 * Configures AWS Config for compliance monitoring
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Created AWS Config recorder
 */
function configureAwsConfig(
    environment: string,
    tags: Record<string, string>
): aws.cfg.ConfigurationRecorder {
    // Create IAM role for AWS Config
    const configRole = new aws.iam.Role(`${environment}-config-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "config.amazonaws.com",
                },
            }],
        }),
        tags: {
            ...tags,
            Name: `${environment}-config-role`,
        },
    });
    
    // Attach managed policy for AWS Config
    new aws.iam.RolePolicyAttachment(`${environment}-config-policy-attachment`, {
        role: configRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
    });
    
    // Create S3 bucket for AWS Config
    const configBucket = new aws.s3.Bucket(`${environment}-config-bucket`, {
        acl: "private",
        forceDestroy: true,
        versioning: {
            enabled: true,
        },
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                },
            },
        },
        tags: {
            ...tags,
            Name: `${environment}-config-bucket`,
        },
    });
    
    // Add bucket policy for AWS Config
    new aws.s3.BucketPolicy(`${environment}-config-bucket-policy`, {
        bucket: configBucket.id,
        policy: pulumi.all([configBucket.arn, configRole.arn]).apply(([bucketArn, roleArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "AllowConfigPutObject",
                    Effect: "Allow",
                    Principal: {
                        AWS: roleArn,
                    },
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/*`,
                },
                {
                    Sid: "AllowConfigGetBucketAcl",
                    Effect: "Allow",
                    Principal: {
                        AWS: roleArn,
                    },
                    Action: "s3:GetBucketAcl",
                    Resource: bucketArn,
                },
                {
                    Sid: "AllowSSLRequestsOnly",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        bucketArn,
                        `${bucketArn}/*`,
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false",
                        },
                    },
                },
            ],
        })),
    });
    
    // Create AWS Config recorder
    const configRecorder = new aws.cfg.ConfigurationRecorder(`${environment}-config-recorder`, {
        roleArn: configRole.arn,
        recordingGroup: {
            allSupported: true,
            includeGlobalResources: true,
        },
    });
    
    // Create AWS Config delivery channel
    new aws.cfg.DeliveryChannel(`${environment}-config-delivery-channel`, {
        s3BucketName: configBucket.id,
        snapshotDeliveryProperties: {
            deliveryFrequency: "One_Hour",
        },
    });
    
    // Set up AWS Config rules for security best practices
    
    // Restrict public access to S3 buckets
    new aws.cfg.Rule(`${environment}-config-rule-s3-public-access`, {
        name: `${environment}-s3-public-access`,
        source: {
            owner: "AWS",
            sourceIdentifier: "S3_BUCKET_PUBLIC_READ_PROHIBITED",
        },
    });
    
    // Ensure CloudTrail is enabled
    new aws.cfg.Rule(`${environment}-config-rule-cloudtrail-enabled`, {
        name: `${environment}-cloudtrail-enabled`,
        source: {
            owner: "AWS",
            sourceIdentifier: "CLOUD_TRAIL_ENABLED",
        },
    });
    
    // Ensure root account MFA is enabled
    new aws.cfg.Rule(`${environment}-config-rule-root-mfa`, {
        name: `${environment}-root-mfa`,
        source: {
            owner: "AWS",
            sourceIdentifier: "ROOT_ACCOUNT_MFA_ENABLED",
        },
    });
    
    // Ensure EBS volumes are encrypted
    new aws.cfg.Rule(`${environment}-config-rule-ebs-encryption`, {
        name: `${environment}-ebs-encryption`,
        source: {
            owner: "AWS",
            sourceIdentifier: "ENCRYPTED_VOLUMES",
        },
    });
    
    // Ensure RDS instances are encrypted
    new aws.cfg.Rule(`${environment}-config-rule-rds-encryption`, {
        name: `${environment}-rds-encryption`,
        source: {
            owner: "AWS",
            sourceIdentifier: "RDS_STORAGE_ENCRYPTED",
        },
    });
    
    // Check for unrestricted SSH access
    new aws.cfg.Rule(`${environment}-config-rule-restricted-ssh`, {
        name: `${environment}-restricted-ssh`,
        source: {
            owner: "AWS",
            sourceIdentifier: "INCOMING_SSH_DISABLED",
        },
    });
    
    // Check for proper IAM password policy
    new aws.cfg.Rule(`${environment}-config-rule-iam-password-policy`, {
        name: `${environment}-iam-password-policy`,
        source: {
            owner: "AWS",
            sourceIdentifier: "IAM_PASSWORD_POLICY",
        },
        inputParameters: JSON.stringify({
            RequireUppercaseCharacters: true,
            RequireLowercaseCharacters: true,
            RequireSymbols: true,
            RequireNumbers: true,
            MinimumPasswordLength: 14,
            PasswordReusePrevention: 24,
            MaxPasswordAge: 90,
        }),
    });
    
    return configRecorder;
}

/**
 * Configures AWS GuardDuty for threat detection
 * 
 * @param environment Deployment environment name
 * @param alertTopic SNS topic for alerts
 * @param tags Resource tags to apply
 * @returns Created GuardDuty detector
 */
function configureGuardDuty(
    environment: string,
    alertTopic: aws.sns.Topic,
    tags: Record<string, string>
): aws.guardduty.Detector {
    // Create GuardDuty detector
    const detector = new aws.guardduty.Detector(`${environment}-guardduty-detector`, {
        enable: true,
        findingPublishingFrequency: "FIFTEEN_MINUTES",
        dataSources: {
            s3Logs: {
                enable: true,
            },
            kubernetes: {
                auditLogs: {
                    enable: true,
                },
            },
            malwareProtection: {
                scanEc2InstanceWithFindings: {
                    ebsVolumes: true,
                },
            },
        },
        tags: {
            ...tags,
            Name: `${environment}-guardduty-detector`,
        },
    });
    
    // Create IAM role for CloudWatch Events
    const eventsRole = new aws.iam.Role(`${environment}-guardduty-events-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "events.amazonaws.com",
                },
            }],
        }),
        tags: {
            ...tags,
            Name: `${environment}-guardduty-events-role`,
        },
    });
    
    // Attach policy for SNS publish
    new aws.iam.RolePolicy(`${environment}-guardduty-events-policy`, {
        role: eventsRole.id,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: "sns:Publish",
                    Resource: alertTopic.arn,
                },
            ],
        }),
    });
    
    // Create EventBridge rule for GuardDuty findings
    const eventRule = new aws.cloudwatch.EventRule(`${environment}-guardduty-event-rule`, {
        description: "Forward GuardDuty findings to SNS",
        eventPattern: JSON.stringify({
            source: ["aws.guardduty"],
            "detail-type": ["GuardDuty Finding"],
            detail: {
                severity: [
                    { numeric: [">=", 4] }, // Medium, High, Critical findings
                ],
            },
        }),
        tags: {
            ...tags,
            Name: `${environment}-guardduty-event-rule`,
        },
    });
    
    // Create EventBridge target for SNS
    new aws.cloudwatch.EventTarget(`${environment}-guardduty-event-target`, {
        rule: eventRule.name,
        arn: alertTopic.arn,
        roleArn: eventsRole.arn,
        inputTransformer: {
            inputPathsMap: JSON.stringify({
                severity: "$.detail.severity",
                findingType: "$.detail.type",
                description: "$.detail.description",
                accountId: "$.detail.accountId",
                region: "$.region",
                time: "$.time",
                id: "$.detail.id",
                title: "$.detail.title",
            }),
            inputTemplate: JSON.stringify({
                "Subject": "GuardDuty Finding: Severity <severity> - <title>",
                "Message": "GuardDuty detected a security issue.\n\nSeverity: <severity>\nType: <findingType>\nDescription: <description>\nAccount: <accountId>\nRegion: <region>\nTime: <time>\nFinding ID: <id>\n\nPlease investigate this security finding promptly."
            }),
        },
    });
    
    // Return the detector
    return detector;
}

/**
 * Creates security policies for S3 buckets, KMS usage, and IAM
 * 
 * @param environment Deployment environment name
 * @param iamRoles IAM roles to attach policies to
 * @param kmsKeys KMS keys to use in policies
 * @param tags Resource tags to apply
 * @returns Map of created IAM policies
 */
function createSecurityPolicies(
    environment: string,
    iamRoles: Record<string, aws.iam.Role>,
    kmsKeys: Record<string, aws.kms.Key>,
    tags: Record<string, string>
): Record<string, aws.iam.Policy> {
    const policies: Record<string, aws.iam.Policy> = {};
    
    // Create S3 bucket access policy
    policies.s3Access = new aws.iam.Policy(`${environment}-s3-access-policy`, {
        description: `Policy for ${environment} S3 bucket access`,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:ListBucket",
                        "s3:DeleteObject",
                    ],
                    Resource: [
                        `arn:aws:s3:::${environment}-revolucare-*/*`,
                        `arn:aws:s3:::${environment}-revolucare-*`,
                    ],
                },
                {
                    Effect: "Deny",
                    Action: [
                        "s3:PutObject",
                    ],
                    Resource: [
                        `arn:aws:s3:::${environment}-revolucare-*/*`,
                    ],
                    Condition: {
                        StringNotEquals: {
                            "s3:x-amz-server-side-encryption": "aws:kms",
                        },
                    },
                },
            ],
        }),
        tags: {
            ...tags,
            Name: `${environment}-s3-access-policy`,
        },
    });
    
    // Attach S3 access policy to relevant roles
    new aws.iam.PolicyAttachment(`${environment}-s3-access-policy-attachment-ecs`, {
        policyArn: policies.s3Access.arn,
        roles: [iamRoles.ecsTask.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-s3-access-policy-attachment-lambda`, {
        policyArn: policies.s3Access.arn,
        roles: [iamRoles.lambda.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-s3-access-policy-attachment-app`, {
        policyArn: policies.s3Access.arn,
        roles: [iamRoles.appService.name],
    });
    
    // Create KMS key usage policy
    policies.kmsUsage = new aws.iam.Policy(`${environment}-kms-usage-policy`, {
        description: `Policy for ${environment} KMS key usage`,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:GenerateDataKey*",
                    ],
                    Resource: [
                        kmsKeys.database.arn,
                        kmsKeys.s3.arn,
                        kmsKeys.secrets.arn,
                    ],
                },
            ],
        }),
        tags: {
            ...tags,
            Name: `${environment}-kms-usage-policy`,
        },
    });
    
    // Attach KMS usage policy to relevant roles
    new aws.iam.PolicyAttachment(`${environment}-kms-usage-policy-attachment-ecs`, {
        policyArn: policies.kmsUsage.arn,
        roles: [iamRoles.ecsTask.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-kms-usage-policy-attachment-lambda`, {
        policyArn: policies.kmsUsage.arn,
        roles: [iamRoles.lambda.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-kms-usage-policy-attachment-app`, {
        policyArn: policies.kmsUsage.arn,
        roles: [iamRoles.appService.name],
    });
    
    // Create Secrets Manager access policy
    policies.secretsAccess = new aws.iam.Policy(`${environment}-secrets-access-policy`, {
        description: `Policy for ${environment} Secrets Manager access`,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret",
                    ],
                    Resource: [
                        `arn:aws:secretsmanager:*:*:secret:${environment}/revolucare/*`,
                    ],
                },
            ],
        }),
        tags: {
            ...tags,
            Name: `${environment}-secrets-access-policy`,
        },
    });
    
    // Attach Secrets Manager access policy to relevant roles
    new aws.iam.PolicyAttachment(`${environment}-secrets-access-policy-attachment-ecs`, {
        policyArn: policies.secretsAccess.arn,
        roles: [iamRoles.ecsTask.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-secrets-access-policy-attachment-lambda`, {
        policyArn: policies.secretsAccess.arn,
        roles: [iamRoles.lambda.name],
    });
    
    new aws.iam.PolicyAttachment(`${environment}-secrets-access-policy-attachment-app`, {
        policyArn: policies.secretsAccess.arn,
        roles: [iamRoles.appService.name],
    });
    
    // Configure IAM password policy
    new aws.iam.AccountPasswordPolicy(`${environment}-password-policy`, {
        minimumPasswordLength: 14,
        requireLowercaseCharacters: true,
        requireUppercaseCharacters: true,
        requireNumbers: true,
        requireSymbols: true,
        allowUsersToChangePassword: true,
        hardExpiry: false,
        maxPasswordAge: 90,
        passwordReusePrevention: 24,
    });
    
    return policies;
}

/**
 * Configures AWS Secrets Manager for sensitive configuration
 * 
 * @param environment Deployment environment name
 * @param kmsKeys KMS keys for encryption
 * @param tags Resource tags to apply
 * @returns Map of created secrets
 */
function configureSecretsManager(
    environment: string,
    kmsKeys: Record<string, aws.kms.Key>,
    tags: Record<string, string>
): Record<string, aws.secretsmanager.Secret> {
    const secrets: Record<string, aws.secretsmanager.Secret> = {};
    
    // Create secret for database credentials
    secrets.database = new aws.secretsmanager.Secret(`${environment}-database-secret`, {
        name: `${environment}/revolucare/database`,
        description: `Database credentials for ${environment} environment`,
        kmsKeyId: kmsKeys.secrets.keyId,
        tags: {
            ...tags,
            Name: `${environment}-database-secret`,
            Purpose: "Database Credentials",
        },
    });
    
    // Default version will be created when RDS is provisioned
    
    // Create secret for external API credentials
    secrets.apiKeys = new aws.secretsmanager.Secret(`${environment}-api-keys-secret`, {
        name: `${environment}/revolucare/api-keys`,
        description: `API keys for ${environment} environment`,
        kmsKeyId: kmsKeys.secrets.keyId,
        tags: {
            ...tags,
            Name: `${environment}-api-keys-secret`,
            Purpose: "External API Credentials",
        },
    });
    
    // Create initial version with empty values
    new aws.secretsmanager.SecretVersion(`${environment}-api-keys-secret-version`, {
        secretId: secrets.apiKeys.id,
        secretString: JSON.stringify({
            openai_api_key: "",
            azure_form_recognizer_key: "",
            stripe_api_key: "",
            sendgrid_api_key: "",
            twilio_api_key: "",
            google_maps_api_key: "",
        }),
    });
    
    // Create secret for JWT signing keys
    secrets.jwtKeys = new aws.secretsmanager.Secret(`${environment}-jwt-keys-secret`, {
        name: `${environment}/revolucare/jwt-keys`,
        description: `JWT signing keys for ${environment} environment`,
        kmsKeyId: kmsKeys.secrets.keyId,
        tags: {
            ...tags,
            Name: `${environment}-jwt-keys-secret`,
            Purpose: "JWT Signing Keys",
        },
    });
    
    // Create initial version with empty values
    new aws.secretsmanager.SecretVersion(`${environment}-jwt-keys-secret-version`, {
        secretId: secrets.jwtKeys.id,
        secretString: JSON.stringify({
            private_key: "",
            public_key: "",
        }),
    });
    
    return secrets;
}

/**
 * Creates security-related CloudWatch alarms and metrics
 * 
 * @param environment Deployment environment name
 * @param alertTopic SNS topic for alerts
 * @param tags Resource tags to apply
 * @returns Map of created alarms
 */
function createSecurityAlarms(
    environment: string,
    alertTopic: aws.sns.Topic,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.MetricAlarm> {
    const alarms: Record<string, aws.cloudwatch.MetricAlarm> = {};
    
    // Create alarm for unauthorized API calls
    alarms.unauthorizedApiCalls = new aws.cloudwatch.MetricAlarm(`${environment}-unauthorized-api-calls-alarm`, {
        alarmDescription: `Alarm for unauthorized API calls in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "UnauthorizedAttemptCount",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 5,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-unauthorized-api-calls-alarm`,
        },
    });
    
    // Create alarm for root account usage
    alarms.rootAccountUsage = new aws.cloudwatch.MetricAlarm(`${environment}-root-account-usage-alarm`, {
        alarmDescription: `Alarm for root account usage in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "RootAccountUsage",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 1,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-root-account-usage-alarm`,
        },
    });
    
    // Create alarm for failed console logins
    alarms.failedConsoleLogins = new aws.cloudwatch.MetricAlarm(`${environment}-failed-console-logins-alarm`, {
        alarmDescription: `Alarm for failed console logins in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "ConsoleLoginFailures",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 10,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-failed-console-logins-alarm`,
        },
    });
    
    // Create alarm for disabled or deleted CMKs
    alarms.disabledCmks = new aws.cloudwatch.MetricAlarm(`${environment}-disabled-cmks-alarm`, {
        alarmDescription: `Alarm for disabled or scheduled for deletion CMKs in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "DisabledOrDeletedKeys",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 1,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-disabled-cmks-alarm`,
        },
    });
    
    // Create alarm for S3 bucket policy changes
    alarms.s3BucketPolicyChanges = new aws.cloudwatch.MetricAlarm(`${environment}-s3-bucket-policy-changes-alarm`, {
        alarmDescription: `Alarm for S3 bucket policy changes in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "S3BucketPolicyChanges",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 1,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-s3-bucket-policy-changes-alarm`,
        },
    });
    
    // Create alarm for security group changes
    alarms.securityGroupChanges = new aws.cloudwatch.MetricAlarm(`${environment}-security-group-changes-alarm`, {
        alarmDescription: `Alarm for security group changes in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "SecurityGroupChanges",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 1,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-security-group-changes-alarm`,
        },
    });
    
    // Create alarm for network ACL changes
    alarms.networkAclChanges = new aws.cloudwatch.MetricAlarm(`${environment}-network-acl-changes-alarm`, {
        alarmDescription: `Alarm for network ACL changes in ${environment} environment`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "NetworkAclChanges",
        namespace: "CloudTrailMetrics",
        period: 300,
        statistic: "Sum",
        threshold: 1,
        treatMissingData: "notBreaching",
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-network-acl-changes-alarm`,
        },
    });
    
    return alarms;
}

/**
 * Loads and processes an IAM policy document from a file
 * 
 * @param policyPath Path to the policy document file
 * @param replacements Map of placeholder variables to replace
 * @returns Processed policy document JSON
 */
function loadPolicyDocument(
    policyPath: string,
    replacements: Record<string, string>
): string {
    try {
        // Read policy file
        let policyContent = fs.readFileSync(path.resolve(__dirname, policyPath), 'utf8');
        
        // Replace placeholder variables
        for (const [key, value] of Object.entries(replacements)) {
            policyContent = policyContent.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        }
        
        // Validate JSON
        JSON.parse(policyContent);
        
        return policyContent;
    } catch (error) {
        throw new Error(`Failed to load policy document from ${policyPath}: ${(error as Error).message}`);
    }
}