import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import { Config } from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import { NetworkOutputs } from './networking';

/**
 * Interface defining the structure of storage infrastructure outputs
 */
export interface StorageOutputs {
    /**
     * Name of the S3 bucket for document storage
     */
    documentBucketName: string;
    
    /**
     * Name of the S3 bucket for static assets
     */
    assetsBucketName: string;
    
    /**
     * Name of the S3 bucket for backups
     */
    backupBucketName: string;
    
    /**
     * Name of the S3 bucket for access logs
     */
    loggingBucketName: string;
    
    /**
     * Domain name of the CloudFront distribution
     */
    cdnDomainName: string;
    
    /**
     * ID of the CloudFront distribution
     */
    cdnDistributionId: string;
    
    /**
     * ID of the VPC endpoint for S3
     */
    vpcEndpointId: string;
}

/**
 * Interface defining the options for storage infrastructure creation
 */
export interface StorageOptions {
    /**
     * Deployment environment (dev, staging, prod)
     */
    environment: string;
    
    /**
     * Outputs from the network infrastructure creation
     */
    networkOutputs: NetworkOutputs;
    
    /**
     * ID of the KMS key for encryption
     */
    kmsKeyId: string;
    
    /**
     * ARN of the SSL certificate for CloudFront
     */
    certificateArn: string;
    
    /**
     * Custom domain names for CloudFront
     */
    domainNames: string[];
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for bucket lifecycle configuration
 */
interface BucketLifecycleConfig {
    /**
     * Days before transitioning to infrequent access storage
     */
    transitionDays: number;
    
    /**
     * Days before transitioning to Glacier storage
     */
    glacierTransitionDays: number;
    
    /**
     * Days before object expiration
     */
    expirationDays: number;
    
    /**
     * Days before non-current version expiration
     */
    nonCurrentVersionExpirationDays: number;
}

/**
 * Interface for CloudFront cache policy configuration
 */
interface CloudFrontCachePolicy {
    /**
     * Minimum time to live in seconds
     */
    minTTL: number;
    
    /**
     * Default time to live in seconds
     */
    defaultTTL: number;
    
    /**
     * Maximum time to live in seconds
     */
    maxTTL: number;
    
    /**
     * HTTP methods allowed for the cache behavior
     */
    allowedMethods: string[];
    
    /**
     * HTTP methods that are cached
     */
    cachedMethods: string[];
    
    /**
     * Values to forward to the origin
     */
    forwardedValues: object;
}

/**
 * Creates and configures all storage infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the storage infrastructure
 * @returns StorageOutputs containing references to created storage resources
 */
export function createStorageInfrastructure(options: StorageOptions): StorageOutputs {
    const {
        environment,
        networkOutputs,
        kmsKeyId,
        certificateArn,
        domainNames,
        tags,
    } = options;
    
    // Create logging bucket first (needed for access logs)
    const loggingBucket = createLoggingBucket(environment, tags);
    
    // Create S3 buckets
    const documentBucket = createDocumentBucket(environment, kmsKeyId, tags);
    const assetsBucket = createAssetsBucket(environment, kmsKeyId, tags);
    const backupBucket = createBackupBucket(environment, kmsKeyId, tags);
    
    // Configure access logging for buckets
    new aws.s3.BucketLogging(`${environment}-document-bucket-logging`, {
        bucket: documentBucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: "documents/",
    });
    
    new aws.s3.BucketLogging(`${environment}-assets-bucket-logging`, {
        bucket: assetsBucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: "assets/",
    });
    
    new aws.s3.BucketLogging(`${environment}-backup-bucket-logging`, {
        bucket: backupBucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: "backups/",
    });
    
    // Create origin access identity for CloudFront
    const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(`${environment}-oai`, {
        comment: `OAI for Revolucare ${environment} assets bucket`,
    });
    
    // Create CloudFront distribution for assets
    const cloudFrontDistribution = createCloudFrontDistribution(
        environment,
        assetsBucket,
        originAccessIdentity,
        certificateArn,
        domainNames,
        tags
    );
    
    // Create VPC endpoint for private S3 access
    const vpcEndpoint = createVpcEndpoints(
        environment,
        networkOutputs.vpcId,
        networkOutputs.privateSubnetIds,
        tags
    );
    
    // Configure bucket policies
    const bucketPolicies = configureBucketPolicies(
        environment,
        documentBucket,
        assetsBucket,
        backupBucket,
        originAccessIdentity
    );
    
    // Configure lifecycle policies
    configureLifecyclePolicies(
        environment,
        documentBucket,
        assetsBucket,
        backupBucket,
        loggingBucket
    );
    
    // Return storage infrastructure outputs
    return {
        documentBucketName: documentBucket.id,
        assetsBucketName: assetsBucket.id,
        backupBucketName: backupBucket.id,
        loggingBucketName: loggingBucket.id,
        cdnDomainName: cloudFrontDistribution.domainName,
        cdnDistributionId: cloudFrontDistribution.id,
        vpcEndpointId: vpcEndpoint.id,
    };
}

/**
 * Creates an S3 bucket for storing medical documents and records with appropriate security settings
 * 
 * @param environment Deployment environment name
 * @param kmsKeyId ID of the KMS key for encryption
 * @param tags Resource tags to apply
 * @returns Created S3 bucket for documents
 */
function createDocumentBucket(
    environment: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.s3.Bucket {
    const bucketName = `revolucare-${environment}-documents`;
    
    // Create bucket for document storage
    const documentBucket = new aws.s3.Bucket(bucketName, {
        bucket: bucketName,
        
        // Block all public access
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        
        // Enable versioning for document history tracking
        versioning: {
            enabled: true,
        },
        
        // Enable server-side encryption with KMS
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "aws:kms",
                    kmsMasterKeyId: kmsKeyId,
                },
                bucketKeyEnabled: true,
            },
        },
        
        // Configure CORS for web access
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
                allowedOrigins: ["https://*.revolucare.com"],
                exposeHeaders: ["ETag"],
                maxAgeSeconds: 3000,
            },
        ],
        
        // Set up lifecycle rules for document archiving
        lifecycleRules: [
            {
                id: "document-archiving",
                enabled: true,
                // Transition to Standard-IA after 90 days
                transitions: [
                    {
                        days: 90,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 365,
                        storageClass: "GLACIER",
                    },
                ],
                // Never expire the medical documents (for compliance)
                noncurrentVersionTransitions: [
                    {
                        days: 30,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 90,
                        storageClass: "GLACIER",
                    },
                ],
                noncurrentVersionExpiration: {
                    days: 365 * 7, // 7 years for compliance with healthcare regulations
                },
            },
        ],
        
        // Apply resource tags
        tags: {
            ...tags,
            Name: bucketName,
            Environment: environment,
            Service: "document-storage",
            ResourceType: "s3",
            DataClassification: "PHI",
            Compliance: "HIPAA",
        },
    });
    
    return documentBucket;
}

/**
 * Creates an S3 bucket for storing static assets with CloudFront distribution
 * 
 * @param environment Deployment environment name
 * @param kmsKeyId ID of the KMS key for encryption
 * @param tags Resource tags to apply
 * @returns Created S3 bucket for assets
 */
function createAssetsBucket(
    environment: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.s3.Bucket {
    const bucketName = `revolucare-${environment}-assets`;
    
    // Create bucket for static assets
    const assetsBucket = new aws.s3.Bucket(bucketName, {
        bucket: bucketName,
        
        // Block public access except through CloudFront
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        
        // Enable versioning for asset history
        versioning: {
            enabled: true,
        },
        
        // Enable server-side encryption with KMS
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "aws:kms",
                    kmsMasterKeyId: kmsKeyId,
                },
                bucketKeyEnabled: true,
            },
        },
        
        // Configure CORS for web access
        corsRules: [
            {
                allowedHeaders: ["*"],
                allowedMethods: ["GET", "HEAD"],
                allowedOrigins: ["*"], // More permissive for static assets
                exposeHeaders: ["ETag"],
                maxAgeSeconds: 3000,
            },
        ],
        
        // Set up lifecycle rules for non-current versions
        lifecycleRules: [
            {
                id: "asset-versioning",
                enabled: true,
                // Keep current versions indefinitely
                // Expire non-current versions after 30 days
                noncurrentVersionExpiration: {
                    days: 30,
                },
            },
        ],
        
        // Apply resource tags
        tags: {
            ...tags,
            Name: bucketName,
            Environment: environment,
            Service: "assets-cdn",
            ResourceType: "s3",
        },
    });
    
    return assetsBucket;
}

/**
 * Creates an S3 bucket for storing backups with appropriate lifecycle policies
 * 
 * @param environment Deployment environment name
 * @param kmsKeyId ID of the KMS key for encryption
 * @param tags Resource tags to apply
 * @returns Created S3 bucket for backups
 */
function createBackupBucket(
    environment: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.s3.Bucket {
    const bucketName = `revolucare-${environment}-backups`;
    
    // Create bucket for backups
    const backupBucket = new aws.s3.Bucket(bucketName, {
        bucket: bucketName,
        
        // Block all public access
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        
        // Enable versioning for backup history
        versioning: {
            enabled: true,
        },
        
        // Enable server-side encryption with KMS
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "aws:kms",
                    kmsMasterKeyId: kmsKeyId,
                },
                bucketKeyEnabled: true,
            },
        },
        
        // Set up lifecycle rules for tiered storage
        lifecycleRules: [
            {
                id: "standard-backup-lifecycle",
                enabled: true,
                // Transition to Standard-IA after 30 days
                // Transition to Glacier after 90 days
                transitions: [
                    {
                        days: 30,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 90,
                        storageClass: "GLACIER",
                    },
                ],
                // Keep backups for 1 year by default
                expiration: {
                    days: 365,
                },
            },
            {
                id: "database-backup-lifecycle",
                enabled: true,
                // Different lifecycle for database backups with prefix
                prefix: "database/",
                transitions: [
                    {
                        days: 7,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 30,
                        storageClass: "GLACIER",
                    },
                ],
                // Keep database backups for 7 years for compliance
                expiration: {
                    days: 365 * 7,
                },
            },
        ],
        
        // Apply resource tags
        tags: {
            ...tags,
            Name: bucketName,
            Environment: environment,
            Service: "backups",
            ResourceType: "s3",
            DataClassification: "Sensitive",
        },
    });
    
    // For production, set up cross-region replication
    if (environment === "prod") {
        // This would typically be implemented with S3 replication configuration
        // but would require additional setup (replication role, destination bucket)
        // that would be addressed in a more complete implementation
    }
    
    return backupBucket;
}

/**
 * Creates an S3 bucket for storing access logs from other buckets
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Created S3 bucket for logs
 */
function createLoggingBucket(
    environment: string,
    tags: Record<string, string>
): aws.s3.Bucket {
    const bucketName = `revolucare-${environment}-logs`;
    
    const loggingBucket = new aws.s3.Bucket(bucketName, {
        bucket: bucketName,
        acl: "log-delivery-write",
        
        // Block all public access
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
        
        // Enable server-side encryption with AES256
        serverSideEncryptionConfiguration: {
            rule: {
                applyServerSideEncryptionByDefault: {
                    sseAlgorithm: "AES256",
                },
                bucketKeyEnabled: true,
            },
        },
        
        // Set up lifecycle rules for log rotation
        lifecycleRules: [
            {
                id: "log-rotation",
                enabled: true,
                // Transition to Standard-IA after 30 days, then to Glacier after 90 days
                transitions: [
                    {
                        days: 30,
                        storageClass: "STANDARD_IA",
                    },
                    {
                        days: 90,
                        storageClass: "GLACIER",
                    },
                ],
                // Delete logs after 365 days
                expiration: {
                    days: 365,
                },
            },
        ],
        
        // Apply resource tags
        tags: {
            ...tags,
            Name: bucketName,
            Environment: environment,
            Service: "logging",
            ResourceType: "s3",
        },
    });
    
    return loggingBucket;
}

/**
 * Creates a CloudFront distribution for serving static assets
 * 
 * @param environment Deployment environment name
 * @param assetsBucket S3 bucket for assets to be served
 * @param originAccessIdentity CloudFront origin access identity for S3 access
 * @param certificateArn ARN of the SSL certificate
 * @param domainNames Custom domain names for the distribution
 * @param tags Resource tags to apply
 * @returns Created CloudFront distribution
 */
function createCloudFrontDistribution(
    environment: string,
    assetsBucket: aws.s3.Bucket,
    originAccessIdentity: aws.cloudfront.OriginAccessIdentity,
    certificateArn: string,
    domainNames: string[],
    tags: Record<string, string>
): aws.cloudfront.Distribution {
    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(`${environment}-cdn`, {
        enabled: true,
        isIpv6Enabled: true,
        priceClass: "PriceClass_100", // Use only North America and Europe edge locations
        
        // Configure origins
        origins: [
            {
                domainName: assetsBucket.bucketRegionalDomainName,
                originId: `S3-${assetsBucket.id}`,
                s3OriginConfig: {
                    originAccessIdentity: originAccessIdentity.cloudfrontAccessIdentityPath,
                },
            },
        ],
        
        // Default cache behavior
        defaultCacheBehavior: {
            allowedMethods: ["GET", "HEAD", "OPTIONS"],
            cachedMethods: ["GET", "HEAD", "OPTIONS"],
            targetOriginId: `S3-${assetsBucket.id}`,
            
            // Forward cookies and query strings as needed
            forwardedValues: {
                queryString: false,
                cookies: {
                    forward: "none",
                },
            },
            
            // Redirect HTTP to HTTPS
            viewerProtocolPolicy: "redirect-to-https",
            
            // Cache settings
            minTtl: 0,
            defaultTtl: 86400,  // 1 day
            maxTtl: 31536000,   // 1 year
            
            // Enable compression
            compress: true,
        },
        
        // Configure custom error responses
        customErrorResponses: [
            {
                errorCode: 403,
                responseCode: 404,
                responsePagePath: "/404.html",
                errorCachingMinTtl: 10,
            },
            {
                errorCode: 404,
                responseCode: 404,
                responsePagePath: "/404.html",
                errorCachingMinTtl: 10,
            },
        ],
        
        // Configure restrictions (optional)
        restrictions: {
            geoRestriction: {
                restrictionType: "none",
                // For healthcare compliance, you might want to restrict to specific countries
                // restrictionType: "whitelist",
                // locations: ["US", "CA"],
            },
        },
        
        // Configure custom domain names and SSL
        aliases: domainNames.length > 0 ? domainNames : undefined,
        viewerCertificate: {
            acmCertificateArn: certificateArn,
            sslSupportMethod: "sni-only",
            minimumProtocolVersion: "TLSv1.2_2021",
        },
        
        // Configure logging
        loggingConfig: {
            bucket: `revolucare-${environment}-logs.s3.amazonaws.com`,
            includeCookies: false,
            prefix: "cdn/",
        },
        
        // Apply resource tags
        tags: {
            ...tags,
            Name: `revolucare-${environment}-cdn`,
            Environment: environment,
            Service: "cdn",
        },
    });
    
    return distribution;
}

/**
 * Creates VPC endpoints for private S3 access
 * 
 * @param environment Deployment environment name
 * @param vpcId ID of the VPC
 * @param subnetIds IDs of private subnets
 * @param tags Resource tags to apply
 * @returns Created VPC endpoint for S3
 */
function createVpcEndpoints(
    environment: string,
    vpcId: string,
    subnetIds: string[],
    tags: Record<string, string>
): aws.ec2.VpcEndpoint {
    // Create VPC endpoint for S3
    const s3Endpoint = new aws.ec2.VpcEndpoint(`${environment}-s3-endpoint`, {
        vpcId: vpcId,
        service: "s3",
        vpcEndpointType: "Gateway",
        routeTableIds: [], // Will be configured separately
        policyDocument: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket",
                    ],
                    Effect: "Allow",
                    Resource: [
                        `arn:aws:s3:::revolucare-${environment}-documents`,
                        `arn:aws:s3:::revolucare-${environment}-documents/*`,
                        `arn:aws:s3:::revolucare-${environment}-assets`,
                        `arn:aws:s3:::revolucare-${environment}-assets/*`,
                        `arn:aws:s3:::revolucare-${environment}-backups`,
                        `arn:aws:s3:::revolucare-${environment}-backups/*`,
                    ],
                    Principal: "*",
                },
            ],
        }),
        tags: {
            ...tags,
            Name: `revolucare-${environment}-s3-endpoint`,
            Environment: environment,
        },
    });
    
    return s3Endpoint;
}

/**
 * Configures bucket policies for appropriate access controls
 * 
 * @param environment Deployment environment name
 * @param documentBucket Document storage bucket
 * @param assetsBucket Static assets bucket
 * @param backupBucket Backup storage bucket
 * @param originAccessIdentity CloudFront OAI for assets access
 * @returns Map of created bucket policies
 */
function configureBucketPolicies(
    environment: string,
    documentBucket: aws.s3.Bucket,
    assetsBucket: aws.s3.Bucket,
    backupBucket: aws.s3.Bucket,
    originAccessIdentity: aws.cloudfront.OriginAccessIdentity
): Record<string, aws.s3.BucketPolicy> {
    // Create policy for document bucket
    const documentBucketPolicy = new aws.s3.BucketPolicy(`${environment}-document-bucket-policy`, {
        bucket: documentBucket.id,
        policy: pulumi.all([documentBucket.arn, documentBucket.id]).apply(([bucketArn, bucketId]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "EnforceSSLOnly",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        `${bucketArn}`,
                        `${bucketArn}/*`,
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false",
                        },
                    },
                },
                {
                    Sid: "EnforceEncryptionOnUpload",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringNotEquals: {
                            "s3:x-amz-server-side-encryption": "aws:kms",
                        },
                    },
                },
                // Additional statements for IAM role access would be added here
                // based on application-specific requirements
            ],
        })),
    });
    
    // Create policy for assets bucket (allow CloudFront access)
    const assetsBucketPolicy = new aws.s3.BucketPolicy(`${environment}-assets-bucket-policy`, {
        bucket: assetsBucket.id,
        policy: pulumi.all([
            assetsBucket.arn, 
            originAccessIdentity.iamArn
        ]).apply(([bucketArn, oaiArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "EnforceSSLOnly",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        `${bucketArn}`,
                        `${bucketArn}/*`,
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false",
                        },
                    },
                },
                {
                    Sid: "AllowCloudFrontAccess",
                    Effect: "Allow",
                    Principal: {
                        AWS: oaiArn,
                    },
                    Action: "s3:GetObject",
                    Resource: `${bucketArn}/*`,
                },
            ],
        })),
    });
    
    // Create policy for backup bucket
    const backupBucketPolicy = new aws.s3.BucketPolicy(`${environment}-backup-bucket-policy`, {
        bucket: backupBucket.id,
        policy: pulumi.all([backupBucket.arn]).apply(([bucketArn]) => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "EnforceSSLOnly",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        `${bucketArn}`,
                        `${bucketArn}/*`,
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false",
                        },
                    },
                },
                {
                    Sid: "EnforceEncryptionOnUpload",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/*`,
                    Condition: {
                        StringNotEquals: {
                            "s3:x-amz-server-side-encryption": "aws:kms",
                        },
                    },
                },
                // Backup-specific policies would be added here
            ],
        })),
    });
    
    return {
        documentBucketPolicy,
        assetsBucketPolicy,
        backupBucketPolicy,
    };
}

/**
 * Configures lifecycle policies for cost optimization and compliance
 * 
 * @param environment Deployment environment name
 * @param documentBucket Document storage bucket
 * @param assetsBucket Static assets bucket
 * @param backupBucket Backup storage bucket
 * @param loggingBucket Logging bucket
 */
function configureLifecyclePolicies(
    environment: string,
    documentBucket: aws.s3.Bucket,
    assetsBucket: aws.s3.Bucket,
    backupBucket: aws.s3.Bucket,
    loggingBucket: aws.s3.Bucket
): void {
    // Lifecycle policies are configured during bucket creation,
    // but additional environment-specific configurations could be added here if needed.
    
    // For example, applying stricter retention in production:
    if (environment === "prod") {
        // Documents in production should be kept longer for compliance
        new aws.s3.BucketLifecycleConfigurationV2(`${environment}-document-extended-lifecycle`, {
            bucket: documentBucket.id,
            rules: [
                {
                    id: "compliance-extended-retention",
                    status: "Enabled",
                    filter: {
                        prefix: "medical/",
                    },
                    noncurrentVersionTransitions: [
                        {
                            noncurrentDays: 365,
                            storageClass: "GLACIER_IR",
                        },
                        {
                            noncurrentDays: 365 * 2,
                            storageClass: "GLACIER",
                        },
                    ],
                    // Extended retention to 10 years for medical documents in production
                    noncurrentVersionExpiration: {
                        noncurrentDays: 365 * 10,
                    },
                },
            ],
        });
    }
}