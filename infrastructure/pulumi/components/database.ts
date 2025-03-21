import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import * as random from '@pulumi/random'; // @pulumi/random ^4.0.0
import { NetworkOutputs } from './networking';

/**
 * Interface for database infrastructure creation options
 */
export interface DatabaseOptions {
    /**
     * Deployment environment (dev, staging, prod)
     */
    environment: string;
    
    /**
     * Outputs from the network infrastructure creation
     */
    networkOutputs: NetworkOutputs;
    
    /**
     * RDS instance type (e.g., db.t3.medium, db.m5.large)
     */
    databaseInstanceType: string;
    
    /**
     * ElastiCache Redis node type (e.g., cache.t3.small, cache.m5.large)
     */
    redisNodeType: string;
    
    /**
     * ID of the KMS key for encryption
     */
    kmsKeyId: string;
    
    /**
     * SNS topic for database alerts
     */
    alertTopic: aws.sns.Topic;
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for database infrastructure outputs
 */
export interface DatabaseOutputs {
    /**
     * Endpoint URL for the PostgreSQL RDS instance
     */
    rdsEndpoint: string;
    
    /**
     * Endpoint URL for the Redis ElastiCache cluster
     */
    redisEndpoint: string;
    
    /**
     * ID of the created RDS instance
     */
    rdsInstanceId: string;
    
    /**
     * ID of the created Redis cluster
     */
    redisClusterId: string;
    
    /**
     * Master username for the RDS instance
     */
    rdsUsername: string;
    
    /**
     * ARN of the secret containing database credentials
     */
    secretArn: string;
    
    /**
     * Port number for the RDS instance
     */
    rdsPort: number;
    
    /**
     * Port number for the Redis cluster
     */
    redisPort: number;
}

/**
 * Interface for database alarm thresholds
 */
interface DatabaseAlarmThresholds {
    /**
     * Threshold for CPU utilization alarms (percentage)
     */
    cpuUtilization: number;
    
    /**
     * Threshold for memory utilization alarms (percentage)
     */
    memoryUtilization: number;
    
    /**
     * Threshold for storage space alarms (percentage)
     */
    storageSpace: number;
    
    /**
     * Threshold for connection count alarms (percentage of max)
     */
    connectionCount: number;
    
    /**
     * Threshold for replica lag alarms (seconds)
     */
    replicaLag: number;
    
    /**
     * Threshold for cache hit ratio alarms (percentage)
     */
    cacheHitRatio: number;
}

/**
 * Creates and configures all database infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the database infrastructure
 * @returns DatabaseOutputs containing references to created database resources
 */
export function createDatabaseInfrastructure(options: DatabaseOptions): DatabaseOutputs {
    const {
        environment,
        networkOutputs,
        databaseInstanceType,
        redisNodeType,
        kmsKeyId,
        alertTopic,
        tags,
    } = options;
    
    // Generate a random password for the database
    const password = new random.RandomPassword(`${environment}-db-password`, {
        length: 16,
        special: true,
        overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
    });
    
    const username = `revolucare_${environment}`;
    const dbname = `revolucare_${environment}`;
    
    // Create RDS parameter group with optimized settings
    const rdsParameterGroup = createRdsParameterGroup(environment, tags);
    
    // Create RDS subnet group
    const rdsSubnetGroup = createRdsSubnetGroup(
        environment,
        networkOutputs.privateSubnetIds,
        tags
    );
    
    // Create RDS instance
    const rdsInstance = createRdsInstance(
        environment,
        databaseInstanceType,
        username,
        password.result,
        rdsSubnetGroup,
        rdsParameterGroup,
        networkOutputs.securityGroupIds.db,
        kmsKeyId,
        tags
    );
    
    // Create Redis parameter group with optimized settings
    const redisParameterGroup = createRedisParameterGroup(environment, tags);
    
    // Create Redis subnet group
    const redisSubnetGroup = createRedisSubnetGroup(
        environment,
        networkOutputs.privateSubnetIds,
        tags
    );
    
    // Create Redis cluster
    const redisCluster = createRedisCluster(
        environment,
        redisNodeType,
        redisSubnetGroup,
        redisParameterGroup,
        networkOutputs.securityGroupIds.redis,
        kmsKeyId,
        tags
    );
    
    // Create CloudWatch alarms
    const alarms = createDatabaseAlarms(
        environment,
        rdsInstance.id,
        redisCluster.id,
        alertTopic,
        tags
    );
    
    // Create database secret in AWS Secrets Manager
    const dbSecret = createDatabaseSecret(
        environment,
        username,
        password.result,
        rdsInstance.endpoint,
        rdsInstance.port,
        dbname,
        kmsKeyId,
        tags
    );
    
    return {
        rdsEndpoint: rdsInstance.endpoint,
        redisEndpoint: redisCluster.primaryEndpointAddress,
        rdsInstanceId: rdsInstance.id,
        redisClusterId: redisCluster.id,
        rdsUsername: username,
        secretArn: dbSecret.arn,
        rdsPort: rdsInstance.port,
        redisPort: 6379,
    };
}

/**
 * Creates a PostgreSQL RDS instance with appropriate configuration for the environment
 * 
 * @param environment Deployment environment name
 * @param instanceType RDS instance type
 * @param username Master username for the RDS instance
 * @param password Master password for the RDS instance
 * @param subnetGroup Subnet group for the RDS instance
 * @param parameterGroup Parameter group for the RDS instance
 * @param securityGroupId Security group ID for the RDS instance
 * @param kmsKeyId KMS key ID for encryption
 * @param tags Resource tags to apply
 * @returns Created RDS instance resource
 */
function createRdsInstance(
    environment: string,
    instanceType: string,
    username: string,
    password: string,
    subnetGroup: aws.rds.SubnetGroup,
    parameterGroup: aws.rds.ParameterGroup,
    securityGroupId: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.rds.Instance {
    // Determine if we should use Multi-AZ based on environment
    const multiAz = environment !== 'dev';
    
    // Determine backup retention period based on environment
    const backupRetentionPeriod = environment === 'prod' ? 30 : (environment === 'staging' ? 14 : 7);
    
    // Determine storage based on environment
    const allocatedStorage = environment === 'prod' ? 100 : (environment === 'staging' ? 50 : 20);
    const maxAllocatedStorage = environment === 'prod' ? 1000 : (environment === 'staging' ? 500 : 100);
    
    // Create the RDS instance
    const rdsInstance = new aws.rds.Instance(`${environment}-postgres`, {
        engine: "postgres",
        engineVersion: "15.3",
        instanceClass: instanceType,
        allocatedStorage: allocatedStorage,
        maxAllocatedStorage: maxAllocatedStorage,
        storageType: "gp3",
        storageEncrypted: true,
        kmsKeyId: kmsKeyId,
        dbName: `revolucare_${environment}`,
        username: username,
        password: password,
        parameterGroupName: parameterGroup.name,
        dbSubnetGroupName: subnetGroup.name,
        vpcSecurityGroupIds: [securityGroupId],
        multiAz: multiAz,
        publiclyAccessible: false,
        skipFinalSnapshot: environment === 'dev',
        finalSnapshotIdentifier: environment !== 'dev' ? `${environment}-postgres-final-${new Date().getTime()}` : undefined,
        backupRetentionPeriod: backupRetentionPeriod,
        backupWindow: "03:00-06:00", // 3 AM - 6 AM UTC
        maintenanceWindow: "mon:00:00-mon:03:00", // Monday 12 AM - 3 AM UTC
        applyImmediately: environment === 'dev',
        autoMinorVersionUpgrade: true,
        deletionProtection: environment === 'prod',
        enabledCloudwatchLogsExports: ["postgresql", "upgrade"],
        performanceInsightsEnabled: environment !== 'dev',
        performanceInsightsKmsKeyId: kmsKeyId,
        performanceInsightsRetentionPeriod: environment === 'prod' ? 731 : 7,
        monitoringInterval: environment === 'prod' ? 60 : 0,
        copyTagsToSnapshot: true,
        tags: {
            ...tags,
            Name: `${environment}-postgres`,
            Component: "Database",
        },
    });
    
    return rdsInstance;
}

/**
 * Creates an RDS parameter group with optimized PostgreSQL settings
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Created parameter group resource
 */
function createRdsParameterGroup(
    environment: string,
    tags: Record<string, string>
): aws.rds.ParameterGroup {
    const parameterGroup = new aws.rds.ParameterGroup(`${environment}-postgres-params`, {
        family: "postgres15",
        description: `PostgreSQL 15 parameter group for ${environment} environment`,
        parameters: [
            {
                name: "shared_buffers",
                value: environment === 'prod' ? "8GB" : (environment === 'staging' ? "4GB" : "1GB"),
                applyMethod: "pending-reboot",
            },
            {
                name: "work_mem",
                value: environment === 'prod' ? "64MB" : (environment === 'staging' ? "32MB" : "16MB"),
                applyMethod: "pending-reboot",
            },
            {
                name: "maintenance_work_mem",
                value: environment === 'prod' ? "1GB" : (environment === 'staging' ? "512MB" : "128MB"),
                applyMethod: "pending-reboot",
            },
            {
                name: "effective_cache_size",
                value: environment === 'prod' ? "24GB" : (environment === 'staging' ? "12GB" : "3GB"),
                applyMethod: "pending-reboot",
            },
            {
                name: "max_connections",
                value: environment === 'prod' ? "200" : (environment === 'staging' ? "100" : "50"),
                applyMethod: "pending-reboot",
            },
            {
                name: "random_page_cost",
                value: "1.1", // Optimized for SSD storage
                applyMethod: "pending-reboot",
            },
            {
                name: "checkpoint_timeout",
                value: "15min",
                applyMethod: "pending-reboot",
            },
            {
                name: "max_wal_size",
                value: environment === 'prod' ? "16GB" : (environment === 'staging' ? "8GB" : "2GB"),
                applyMethod: "pending-reboot",
            },
            {
                name: "wal_buffers",
                value: "16MB",
                applyMethod: "pending-reboot",
            },
            {
                name: "statement_timeout",
                value: "60000", // 60 seconds in milliseconds
                applyMethod: "pending-reboot",
            },
            {
                name: "log_min_duration_statement",
                value: environment === 'prod' ? "1000" : "100", // Log slow queries (>1s in prod, >100ms in other envs)
                applyMethod: "pending-reboot",
            },
            {
                name: "log_connections",
                value: "1",
                applyMethod: "pending-reboot",
            },
            {
                name: "log_disconnections",
                value: "1",
                applyMethod: "pending-reboot",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-postgres-params`,
            Component: "Database",
        },
    });
    
    return parameterGroup;
}

/**
 * Creates an RDS subnet group using private subnets
 * 
 * @param environment Deployment environment name
 * @param subnetIds IDs of private subnets for the subnet group
 * @param tags Resource tags to apply
 * @returns Created subnet group resource
 */
function createRdsSubnetGroup(
    environment: string,
    subnetIds: string[],
    tags: Record<string, string>
): aws.rds.SubnetGroup {
    const subnetGroup = new aws.rds.SubnetGroup(`${environment}-postgres-subnet-group`, {
        subnetIds: subnetIds,
        description: `Subnet group for ${environment} PostgreSQL RDS instances`,
        tags: {
            ...tags,
            Name: `${environment}-postgres-subnet-group`,
            Component: "Database",
        },
    });
    
    return subnetGroup;
}

/**
 * Creates a Redis ElastiCache cluster with appropriate configuration
 * 
 * @param environment Deployment environment name
 * @param nodeType Redis node type
 * @param subnetGroup Subnet group for the Redis cluster
 * @param parameterGroup Parameter group for the Redis cluster
 * @param securityGroupId Security group ID for the Redis cluster
 * @param kmsKeyId KMS key ID for encryption
 * @param tags Resource tags to apply
 * @returns Created Redis cluster resource
 */
function createRedisCluster(
    environment: string,
    nodeType: string,
    subnetGroup: aws.elasticache.SubnetGroup,
    parameterGroup: aws.elasticache.ParameterGroup,
    securityGroupId: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.elasticache.ReplicationGroup {
    // Determine number of replicas based on environment
    const numReplicas = environment === 'dev' ? 1 : 2;
    
    // Determine backup retention period based on environment
    const backupRetentionPeriod = environment === 'prod' ? 14 : (environment === 'staging' ? 7 : 1);
    
    // Create the Redis cluster
    const redisCluster = new aws.elasticache.ReplicationGroup(`${environment}-redis`, {
        engine: "redis",
        engineVersion: "7.0",
        nodeType: nodeType,
        parameterGroupName: parameterGroup.name,
        subnetGroupName: subnetGroup.name,
        securityGroupIds: [securityGroupId],
        port: 6379,
        replicationGroupDescription: `Redis cluster for ${environment} environment`,
        numCacheClusters: 1 + numReplicas, // Primary + replicas
        automaticFailoverEnabled: true,
        multiAzEnabled: environment !== 'dev',
        autoMinorVersionUpgrade: true,
        snapshotRetentionLimit: backupRetentionPeriod,
        snapshotWindow: "02:00-05:00", // 2 AM - 5 AM UTC
        maintenanceWindow: "sun:00:00-sun:03:00", // Sunday 12 AM - 3 AM UTC
        atRestEncryptionEnabled: true,
        kmsKeyId: kmsKeyId,
        transitEncryptionEnabled: true,
        applyImmediately: environment === 'dev',
        tags: {
            ...tags,
            Name: `${environment}-redis`,
            Component: "Redis",
        },
    });
    
    return redisCluster;
}

/**
 * Creates a Redis parameter group with optimized settings
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Created parameter group resource
 */
function createRedisParameterGroup(
    environment: string,
    tags: Record<string, string>
): aws.elasticache.ParameterGroup {
    const parameterGroup = new aws.elasticache.ParameterGroup(`${environment}-redis-params`, {
        family: "redis7",
        description: `Redis 7.0 parameter group for ${environment} environment`,
        parameters: [
            {
                name: "maxmemory-policy",
                value: environment === 'prod' ? "volatile-lru" : "allkeys-lru",
            },
            {
                name: "notify-keyspace-events",
                value: "KEA", // Key events, expired events, all commands
            },
            {
                name: "timeout",
                value: "300", // 5 minutes in seconds
            },
            {
                name: "maxclients",
                value: environment === 'prod' ? "65000" : "10000",
            },
            {
                name: "active-defrag-threshold-lower",
                value: "10", // Start defrag when fragmentation is above 10%
            },
            {
                name: "active-defrag-threshold-upper",
                value: "100", // Maximum defrag effort at 100% fragmentation
            },
            {
                name: "client-output-buffer-limit-normal",
                value: "0 0 0", // No limit for normal clients
            },
            {
                name: "client-output-buffer-limit-slave",
                value: "512mb 1024mb 60", // Limit for replica clients
            },
            {
                name: "client-output-buffer-limit-pubsub",
                value: "32mb 64mb 60", // Limit for pubsub clients
            },
            {
                name: "maxmemory-samples",
                value: "10", // Number of keys to sample for LRU
            },
            {
                name: "appendonly",
                value: environment === 'prod' ? "yes" : "no", // Enable AOF persistence in prod
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-redis-params`,
            Component: "Redis",
        },
    });
    
    return parameterGroup;
}

/**
 * Creates a Redis subnet group using private subnets
 * 
 * @param environment Deployment environment name
 * @param subnetIds IDs of private subnets for the subnet group
 * @param tags Resource tags to apply
 * @returns Created subnet group resource
 */
function createRedisSubnetGroup(
    environment: string,
    subnetIds: string[],
    tags: Record<string, string>
): aws.elasticache.SubnetGroup {
    const subnetGroup = new aws.elasticache.SubnetGroup(`${environment}-redis-subnet-group`, {
        subnetIds: subnetIds,
        description: `Subnet group for ${environment} Redis ElastiCache clusters`,
        tags: {
            ...tags,
            Name: `${environment}-redis-subnet-group`,
            Component: "Redis",
        },
    });
    
    return subnetGroup;
}

/**
 * Creates CloudWatch alarms for database metrics
 * 
 * @param environment Deployment environment name
 * @param rdsInstanceId ID of the RDS instance to monitor
 * @param redisClusterId ID of the Redis cluster to monitor
 * @param alertTopic SNS topic for alarm notifications
 * @param tags Resource tags to apply
 * @returns Map of created alarms
 */
function createDatabaseAlarms(
    environment: string,
    rdsInstanceId: string,
    redisClusterId: string,
    alertTopic: aws.sns.Topic,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.MetricAlarm> {
    // Define thresholds based on environment
    const thresholds: DatabaseAlarmThresholds = {
        cpuUtilization: environment === 'prod' ? 75 : 85,
        memoryUtilization: environment === 'prod' ? 75 : 85,
        storageSpace: environment === 'prod' ? 80 : 90,
        connectionCount: environment === 'prod' ? 80 : 90,
        replicaLag: environment === 'prod' ? 60 : 300, // seconds
        cacheHitRatio: environment === 'prod' ? 70 : 50, // percentage
    };
    
    const alarms: Record<string, aws.cloudwatch.MetricAlarm> = {};
    
    // RDS CPU Utilization Alarm
    alarms.rdsCpuUtilization = new aws.cloudwatch.MetricAlarm(`${environment}-rds-cpu-alarm`, {
        alarmDescription: `${environment} RDS CPU Utilization > ${thresholds.cpuUtilization}%`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 3,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: thresholds.cpuUtilization,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            DBInstanceIdentifier: rdsInstanceId,
        },
        tags: {
            ...tags,
            Name: `${environment}-rds-cpu-alarm`,
            Component: "Monitoring",
        },
    });
    
    // RDS Free Storage Space Alarm
    alarms.rdsFreeStorageSpace = new aws.cloudwatch.MetricAlarm(`${environment}-rds-storage-alarm`, {
        alarmDescription: `${environment} RDS Free Storage Space < ${100 - thresholds.storageSpace}%`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 2,
        metricName: "FreeStorageSpace",
        namespace: "AWS/RDS",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: environment === 'prod' ? 20480 : 5120, // MB (20GB for prod, 5GB for others)
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            DBInstanceIdentifier: rdsInstanceId,
        },
        tags: {
            ...tags,
            Name: `${environment}-rds-storage-alarm`,
            Component: "Monitoring",
        },
    });
    
    // RDS Database Connections Alarm
    alarms.rdsConnections = new aws.cloudwatch.MetricAlarm(`${environment}-rds-connections-alarm`, {
        alarmDescription: `${environment} RDS Database Connections > ${thresholds.connectionCount}%`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "DatabaseConnections",
        namespace: "AWS/RDS",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: environment === 'prod' ? 160 : 45, // 80% of max connections (prod: 200, others: 50)
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            DBInstanceIdentifier: rdsInstanceId,
        },
        tags: {
            ...tags,
            Name: `${environment}-rds-connections-alarm`,
            Component: "Monitoring",
        },
    });
    
    // RDS Replica Lag Alarm (only for multi-AZ deployments)
    if (environment !== 'dev') {
        alarms.rdsReplicaLag = new aws.cloudwatch.MetricAlarm(`${environment}-rds-replica-lag-alarm`, {
            alarmDescription: `${environment} RDS Replica Lag > ${thresholds.replicaLag} seconds`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "ReplicaLag",
            namespace: "AWS/RDS",
            period: 300, // 5 minutes
            statistic: "Average",
            threshold: thresholds.replicaLag,
            alarmActions: [alertTopic.arn],
            okActions: [alertTopic.arn],
            insufficientDataActions: [],
            dimensions: {
                DBInstanceIdentifier: rdsInstanceId,
            },
            tags: {
                ...tags,
                Name: `${environment}-rds-replica-lag-alarm`,
                Component: "Monitoring",
            },
        });
    }
    
    // Redis CPU Utilization Alarm
    alarms.redisCpuUtilization = new aws.cloudwatch.MetricAlarm(`${environment}-redis-cpu-alarm`, {
        alarmDescription: `${environment} Redis CPU Utilization > ${thresholds.cpuUtilization}%`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 3,
        metricName: "CPUUtilization",
        namespace: "AWS/ElastiCache",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: thresholds.cpuUtilization,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            ReplicationGroupId: redisClusterId,
        },
        tags: {
            ...tags,
            Name: `${environment}-redis-cpu-alarm`,
            Component: "Monitoring",
        },
    });
    
    // Redis Memory Usage Alarm
    alarms.redisMemoryUsage = new aws.cloudwatch.MetricAlarm(`${environment}-redis-memory-alarm`, {
        alarmDescription: `${environment} Redis Memory Usage > ${thresholds.memoryUtilization}%`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 3,
        metricName: "DatabaseMemoryUsagePercentage",
        namespace: "AWS/ElastiCache",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: thresholds.memoryUtilization,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            ReplicationGroupId: redisClusterId,
        },
        tags: {
            ...tags,
            Name: `${environment}-redis-memory-alarm`,
            Component: "Monitoring",
        },
    });
    
    // Redis Cache Hit Ratio Alarm
    alarms.redisCacheHitRatio = new aws.cloudwatch.MetricAlarm(`${environment}-redis-hit-ratio-alarm`, {
        alarmDescription: `${environment} Redis Cache Hit Ratio < ${thresholds.cacheHitRatio}%`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 3,
        metricName: "CacheHitRate",
        namespace: "AWS/ElastiCache",
        period: 3600, // 1 hour (longer period for stable metric)
        statistic: "Average",
        threshold: thresholds.cacheHitRatio,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        insufficientDataActions: [],
        dimensions: {
            ReplicationGroupId: redisClusterId,
        },
        treatMissingData: "notBreaching", // Don't alert on missing data
        tags: {
            ...tags,
            Name: `${environment}-redis-hit-ratio-alarm`,
            Component: "Monitoring",
        },
    });
    
    return alarms;
}

/**
 * Creates a secret in AWS Secrets Manager for database credentials
 * 
 * @param environment Deployment environment name
 * @param username Database username
 * @param password Database password
 * @param host Database host endpoint
 * @param port Database port
 * @param dbname Database name
 * @param kmsKeyId KMS key ID for encryption
 * @param tags Resource tags to apply
 * @returns Created secret resource
 */
function createDatabaseSecret(
    environment: string,
    username: string,
    password: string,
    host: string,
    port: number,
    dbname: string,
    kmsKeyId: string,
    tags: Record<string, string>
): aws.secretsmanager.Secret {
    // Create the secret value
    const secretValue = pulumi.output({
        username: username,
        password: password,
        engine: "postgres",
        host: host,
        port: port,
        dbname: dbname,
    }).apply(JSON.stringify);
    
    // Create the secret
    const secret = new aws.secretsmanager.Secret(`${environment}-db-secret`, {
        name: `${environment}/revolucare/db-credentials`,
        description: `Database credentials for Revolucare ${environment} environment`,
        kmsKeyId: kmsKeyId,
        tags: {
            ...tags,
            Name: `${environment}-db-secret`,
            Component: "Security",
        },
    });
    
    // Add the secret value
    const secretVersion = new aws.secretsmanager.SecretVersion(`${environment}-db-secret-version`, {
        secretId: secret.id,
        secretString: secretValue,
    });
    
    // Set up automatic rotation for production
    if (environment === 'prod') {
        // Note: Secret rotation would typically be set up here with a Lambda function
        // This is omitted for simplicity but would be implemented in production
    }
    
    return secret;
}