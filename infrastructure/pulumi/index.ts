import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.78.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.42.0
import { config as dotenvConfig } from 'dotenv'; // dotenv ^16.0.3
import * as path from 'path'; // built-in
import * as fs from 'fs'; // built-in
import { createNetworkInfrastructure, NetworkOutputs } from './components/networking';
import { createDatabaseInfrastructure, DatabaseOutputs } from './components/database';
import { createComputeInfrastructure, ComputeOutputs } from './components/compute';
import { createStorageInfrastructure, StorageOutputs } from './components/storage';
import { createMonitoringInfrastructure, MonitoringOutputs } from './components/monitoring';
import { createSecurityInfrastructure, SecurityOutputs } from './components/security';

// Load environment variables from .env file
dotenvConfig();

// Define the EnvironmentConfig interface
interface EnvironmentConfig {
    environment: string;
    region: string;
    vpcCidr: string;
    availabilityZones: number;
    databaseInstanceType: string;
    redisNodeType: string;
    ecsTaskCpu: number;
    ecsTaskMemory: number;
    containerImages: Record<string, string>;
    domainNames: string[];
    alertEmailAddresses: string[];
    vercelProjectId: string;
    vercelTeamId: string;
}

// Define the InfrastructureOutputs interface
interface InfrastructureOutputs {
    networkOutputs: NetworkOutputs;
    databaseOutputs: DatabaseOutputs;
    computeOutputs: ComputeOutputs;
    storageOutputs: StorageOutputs;
    monitoringOutputs: MonitoringOutputs;
    securityOutputs: SecurityOutputs;
    vercelConfig: any;
}

/**
 * Retrieves environment-specific configuration values
 * 
 * @returns {EnvironmentConfig} Configuration values for the current environment
 */
function getEnvironmentConfig(): EnvironmentConfig {
    // Get environment name from Pulumi config
    const config = new pulumi.Config('revolucare');
    const environment = config.require('environment');
    const region = config.require('region');

    // Load environment-specific variables from .env file if available
    const envFilePath = path.resolve(__dirname, `../../.env.${environment}`);
    if (fs.existsSync(envFilePath)) {
        dotenvConfig({ path: envFilePath });
    }

    // Set default values for required configuration
    const vpcCidr = config.get('vpcCidr') || '10.0.0.0/16';
    const availabilityZones = config.getNumber('availabilityZones') || 2;
    const databaseInstanceType = config.get('databaseInstanceType') || 'db.t3.medium';
    const redisNodeType = config.get('redisNodeType') || 'cache.t3.small';
    const ecsTaskCpu = config.getNumber('ecsTaskCpu') || 256;
    const ecsTaskMemory = config.getNumber('ecsTaskMemory') || 512;
    const containerImages = config.getObject<Record<string, string>>('containerImages') || {};
    const domainNames = config.get('domainNames') ? config.get('domainNames')?.split(',') : [];
    const alertEmailAddresses = config.get('alertEmailAddresses') ? config.get('alertEmailAddresses')?.split(',') : [];
    const vercelProjectId = config.require('vercelProjectId');
    const vercelTeamId = config.require('vercelTeamId');

    // Validate required configuration values
    if (!environment) {
        throw new Error('Missing required configuration: environment');
    }
    if (!region) {
        throw new Error('Missing required configuration: region');
    }
    if (!vercelProjectId) {
        throw new Error('Missing required configuration: vercelProjectId');
    }
    if (!vercelTeamId) {
        throw new Error('Missing required configuration: vercelTeamId');
    }

    // Return environment configuration object
    return {
        environment,
        region,
        vpcCidr,
        availabilityZones,
        databaseInstanceType,
        redisNodeType,
        ecsTaskCpu,
        ecsTaskMemory,
        containerImages,
        domainNames,
        alertEmailAddresses,
        vercelProjectId,
        vercelTeamId,
    };
}

/**
 * Creates common resource tags for all infrastructure components
 * 
 * @param {string} environment - The deployment environment (dev, staging, prod)
 * @returns {Record<string, string>} A map of resource tags
 */
function createResourceTags(environment: string): Record<string, string> {
    // Create standard tags including environment, project, managed-by
    const tags: Record<string, string> = {
        Environment: environment,
        Project: 'Revolucare',
        'Managed-By': 'Pulumi',
    };

    // Add timestamp for creation tracking
    tags['Created-At'] = new Date().toISOString();

    // Add cost center and owner tags for resource attribution
    tags['Cost-Center'] = 'Healthcare';
    tags['Owner'] = 'Revolucare Engineering';

    // Return map of resource tags
    return tags;
}

/**
 * Configures Vercel integration for Next.js application deployment
 * 
 * @param {string} environment - The deployment environment (dev, staging, prod)
 * @param {object} infrastructureOutputs - The infrastructure outputs containing references to created resources
 * @returns {object} The Vercel deployment configuration
 */
function configureVercelIntegration(environment: string, infrastructureOutputs: any): any {
    // Create Vercel project configuration
    const vercelConfig: any = {
        projectId: infrastructureOutputs.vercelProjectId,
        teamId: infrastructureOutputs.vercelTeamId,
        environmentVariables: {
            // Set up database connection strings
            DATABASE_URL: infrastructureOutputs.databaseOutputs.secretArn,
            DATABASE_HOST: infrastructureOutputs.databaseOutputs.rdsEndpoint,
            DATABASE_PORT: infrastructureOutputs.databaseOutputs.rdsPort,
            DATABASE_USERNAME: infrastructureOutputs.databaseOutputs.rdsUsername,
            // Configure Redis connection information
            REDIS_HOST: infrastructureOutputs.databaseOutputs.redisEndpoint,
            REDIS_PORT: infrastructureOutputs.databaseOutputs.redisPort,
            // Set S3 bucket and CloudFront URLs
            DOCUMENT_BUCKET_URL: infrastructureOutputs.storageOutputs.documentBucketName,
            ASSETS_BUCKET_URL: infrastructureOutputs.storageOutputs.assetsBucketName,
            CDN_DOMAIN: infrastructureOutputs.storageOutputs.cdnDomainName,
            // Configure API endpoints and authentication settings
            API_ENDPOINT: `https://api.revolucare-${environment}.com`,
            AUTH_SECRET: 'your-auth-secret',
            // Set up domain and HTTPS configuration
            DOMAIN_NAMES: infrastructureOutputs.domainNames.join(','),
            HTTPS: 'true',
        },
    };

    // Return Vercel deployment configuration
    return vercelConfig;
}

/**
 * Main function that orchestrates the creation and configuration of all infrastructure components
 */
async function configureInfrastructure() {
    // Load environment-specific configuration from Pulumi config
    const envConfig = getEnvironmentConfig();

    // Create common resource tags for all infrastructure components
    const tags = createResourceTags(envConfig.environment);

    // Create networking infrastructure (VPC, subnets, security groups)
    const networkOutputs = createNetworkInfrastructure({
        environment: envConfig.environment,
        vpcCidr: envConfig.vpcCidr,
        publicSubnetCidrs: [`10.0.1.0/24`, `10.0.2.0/24`],
        privateSubnetCidrs: [`10.0.11.0/24`, `10.0.12.0/24`],
        availabilityZones: envConfig.availabilityZones,
        tags: tags,
    });

    // Create database infrastructure (PostgreSQL RDS, Redis ElastiCache)
    const databaseOutputs = createDatabaseInfrastructure({
        environment: envConfig.environment,
        networkOutputs: networkOutputs,
        databaseInstanceType: envConfig.databaseInstanceType,
        redisNodeType: envConfig.redisNodeType,
        kmsKeyId: 'your-kms-key-id',
        alertTopic: {} as aws.sns.Topic,
        tags: tags,
    });

    // Create storage infrastructure (S3 buckets, CloudFront)
    const storageOutputs = createStorageInfrastructure({
        environment: envConfig.environment,
        networkOutputs: networkOutputs,
        kmsKeyId: 'your-kms-key-id',
        certificateArn: 'your-certificate-arn',
        domainNames: envConfig.domainNames,
        tags: tags,
    });

    // Create compute infrastructure (ECS clusters, services)
    const computeOutputs = createComputeInfrastructure({
        environment: envConfig.environment,
        networkOutputs: networkOutputs,
        databaseOutputs: databaseOutputs,
        storageOutputs: storageOutputs,
        containerImages: envConfig.containerImages,
        ecsTaskCpu: envConfig.ecsTaskCpu,
        ecsTaskMemory: envConfig.ecsTaskMemory,
        certificateArn: 'your-certificate-arn',
        executionRoleArn: 'your-execution-role-arn',
        taskRoleArn: 'your-task-role-arn',
        alertTopic: {} as aws.sns.Topic,
        tags: tags,
    });

    // Create monitoring infrastructure (CloudWatch dashboards, alarms)
    const monitoringOutputs = createMonitoringInfrastructure({
        environment: envConfig.environment,
        networkOutputs: networkOutputs,
        databaseOutputs: databaseOutputs,
        computeOutputs: computeOutputs,
        storageOutputs: storageOutputs,
        alertEmailAddresses: envConfig.alertEmailAddresses,
        executionRoleArn: 'your-execution-role-arn',
        tags: tags,
    });

    // Create security infrastructure (IAM roles, KMS keys, WAF)
    const securityOutputs = createSecurityInfrastructure({
        environment: envConfig.environment,
        networkOutputs: networkOutputs,
        loadBalancerArn: computeOutputs.loadBalancerArn,
        domainNames: envConfig.domainNames,
        alertTopic: {} as aws.sns.Topic,
        tags: tags,
    });

    // Configure Vercel integration for Next.js application deployment
    const vercelConfig = configureVercelIntegration(envConfig.environment, {
        vercelProjectId: envConfig.vercelProjectId,
        vercelTeamId: envConfig.vercelTeamId,
        domainNames: envConfig.domainNames,
        databaseOutputs: databaseOutputs,
        storageOutputs: storageOutputs,
    });

    // Export infrastructure outputs as Pulumi stack outputs
    return {
        networkOutputs,
        databaseOutputs,
        computeOutputs,
        storageOutputs,
        monitoringOutputs,
        securityOutputs,
        vercelConfig,
    };
}

// Configure and deploy the infrastructure
configureInfrastructure().then(infrastructureOutputs => {
    // Export all infrastructure outputs for use in other Pulumi stacks or external systems
    exports.networkOutputs = infrastructureOutputs.networkOutputs;
    exports.databaseOutputs = infrastructureOutputs.databaseOutputs;
    exports.computeOutputs = infrastructureOutputs.computeOutputs;
    exports.storageOutputs = infrastructureOutputs.storageOutputs;
    exports.monitoringOutputs = infrastructureOutputs.monitoringOutputs;
    exports.securityOutputs = infrastructureOutputs.securityOutputs;
    exports.vercelConfig = infrastructureOutputs.vercelConfig;
});