import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import * as fs from 'fs'; // fs built-in
import * as path from 'path'; // path built-in
import { NetworkOutputs } from './networking';
import { DatabaseOutputs } from './database';
import { ComputeOutputs } from './compute';
import { StorageOutputs } from './storage';

/**
 * Interface defining the structure of monitoring infrastructure outputs
 */
export interface MonitoringOutputs {
    /**
     * Map of dashboard URLs by dashboard name
     */
    dashboardUrls: Record<string, string>;
    
    /**
     * ARN of the SNS topic for alerts
     */
    snsTopicArn: string;
    
    /**
     * Map of log group names by component
     */
    logGroupNames: Record<string, string>;
    
    /**
     * Map of alarm ARNs by alarm name
     */
    alarmArns: Record<string, string>;
    
    /**
     * Map of canary ARNs by canary name
     */
    canaryArns: Record<string, string>;
    
    /**
     * ID of the AWS Managed Prometheus workspace
     */
    prometheusWorkspaceId?: string;
    
    /**
     * ID of the AWS Managed Grafana workspace
     */
    grafanaWorkspaceId?: string;
    
    /**
     * Endpoint URL for the Grafana workspace
     */
    grafanaEndpoint?: string;
}

/**
 * Interface defining the options for monitoring infrastructure creation
 */
export interface MonitoringOptions {
    /**
     * Deployment environment (dev, staging, prod)
     */
    environment: string;
    
    /**
     * Outputs from the network infrastructure creation
     */
    networkOutputs: NetworkOutputs;
    
    /**
     * Outputs from the database infrastructure creation
     */
    databaseOutputs: DatabaseOutputs;
    
    /**
     * Outputs from the compute infrastructure creation
     */
    computeOutputs: ComputeOutputs;
    
    /**
     * Outputs from the storage infrastructure creation
     */
    storageOutputs: StorageOutputs;
    
    /**
     * Email addresses for monitoring alerts
     */
    alertEmailAddresses: string[];
    
    /**
     * Whether to enable AWS Managed Prometheus
     */
    enablePrometheus?: boolean;
    
    /**
     * Whether to enable AWS Managed Grafana
     */
    enableGrafana?: boolean;
    
    /**
     * ARN of the IAM role for canary execution
     */
    executionRoleArn: string;
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for alarm threshold configuration
 */
interface AlarmThreshold {
    /**
     * Warning threshold value
     */
    warning: number;
    
    /**
     * Critical threshold value
     */
    critical: number;
    
    /**
     * Number of periods to evaluate
     */
    evaluationPeriods: number;
    
    /**
     * Number of datapoints that must breach threshold
     */
    datapointsToAlarm: number;
}

/**
 * Interface for dashboard template configuration
 */
interface DashboardTemplate {
    /**
     * Name of the dashboard
     */
    name: string;
    
    /**
     * Path to the dashboard template file
     */
    templatePath: string;
    
    /**
     * Placeholder replacements for the template
     */
    replacements: Record<string, string>;
}

/**
 * Interface for log group configuration
 */
interface LogGroupConfig {
    /**
     * Name of the log group
     */
    name: string;
    
    /**
     * Log retention period in days
     */
    retentionInDays: number;
    
    /**
     * KMS key ID for encryption
     */
    kmsKeyId?: string;
}

/**
 * Interface for metric filter configuration
 */
interface MetricFilterConfig {
    /**
     * Name of the metric filter
     */
    name: string;
    
    /**
     * Log group to apply the filter to
     */
    logGroupName: string;
    
    /**
     * Pattern to match in log events
     */
    filterPattern: string;
    
    /**
     * Namespace for the generated metric
     */
    metricNamespace: string;
    
    /**
     * Name for the generated metric
     */
    metricName: string;
    
    /**
     * Value to assign to the metric
     */
    metricValue: string;
    
    /**
     * Dimensions for the metric
     */
    dimensions?: Record<string, string>;
}

/**
 * Creates and configures all monitoring infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the monitoring infrastructure
 * @returns MonitoringOutputs containing references to created monitoring resources
 */
export function createMonitoringInfrastructure(options: MonitoringOptions): MonitoringOutputs {
    const {
        environment,
        networkOutputs,
        databaseOutputs,
        computeOutputs,
        storageOutputs,
        alertEmailAddresses,
        enablePrometheus = false,
        enableGrafana = false,
        executionRoleArn,
        tags,
    } = options;

    // Get configuration values from Pulumi config
    const config = new pulumi.Config();
    
    // Create SNS topic for alerts
    const alertTopic = createSnsAlertTopic(environment, alertEmailAddresses, tags);

    // Create CloudWatch log groups
    const logGroups = createCloudWatchLogGroups(environment, tags);

    // Create metric filters for extracting metrics from logs
    const metricFilters = createMetricFilters(environment, logGroups, tags);

    // Create CloudWatch dashboards for different user roles
    const dashboards = createCloudWatchDashboards(
        environment,
        networkOutputs,
        databaseOutputs,
        computeOutputs,
        storageOutputs,
        tags
    );

    // Create CloudWatch alarms for critical metrics
    const alarms = createCloudWatchAlarms(
        environment,
        alertTopic,
        databaseOutputs,
        computeOutputs,
        storageOutputs,
        tags
    );

    // Create composite alarms for complex conditions
    const compositeAlarms = createCompositeAlarms(
        environment,
        alarms,
        alertTopic,
        tags
    );

    // Create Synthetics canaries for endpoint monitoring
    const canaries = createSyntheticsCanaries(
        environment,
        executionRoleArn,
        tags
    );

    // Create CloudWatch Insights queries
    const queries = createCloudWatchInsightsQueries(
        environment,
        logGroups,
        tags
    );

    // Create Prometheus and Grafana resources if enabled
    let prometheusResources;
    let grafanaResources;

    if (enablePrometheus) {
        prometheusResources = createPrometheusResources(
            environment,
            networkOutputs.vpcId,
            networkOutputs.privateSubnetIds,
            networkOutputs.securityGroupIds.app,
            tags
        );
    }

    if (enableGrafana && prometheusResources) {
        grafanaResources = createGrafanaResources(
            environment,
            prometheusResources.workspaceId,
            alertEmailAddresses,
            tags
        );
    }

    // Prepare outputs
    const dashboardUrls: Record<string, string> = {};
    Object.entries(dashboards).forEach(([name, dashboard]) => {
        dashboardUrls[name] = pulumi.interpolate`https://${aws.config.region}.console.aws.amazon.com/cloudwatch/home?region=${aws.config.region}#dashboards:name=${dashboard.dashboardName}`.apply(url => url);
    });

    const logGroupNames: Record<string, string> = {};
    Object.entries(logGroups).forEach(([name, logGroup]) => {
        logGroupNames[name] = logGroup.name;
    });

    const alarmArns: Record<string, string> = {};
    Object.entries(alarms).forEach(([name, alarm]) => {
        alarmArns[name] = alarm.arn;
    });

    const canaryArns: Record<string, string> = {};
    Object.entries(canaries).forEach(([name, canary]) => {
        canaryArns[name] = canary.arn;
    });

    return {
        dashboardUrls,
        snsTopicArn: alertTopic.arn,
        logGroupNames,
        alarmArns,
        canaryArns,
        prometheusWorkspaceId: prometheusResources?.workspaceId,
        grafanaWorkspaceId: grafanaResources?.workspaceId,
        grafanaEndpoint: grafanaResources?.endpoint,
    };
}

/**
 * Creates an SNS topic for monitoring alerts with email subscriptions
 * 
 * @param environment Deployment environment name
 * @param emailAddresses Email addresses to subscribe to the topic
 * @param tags Resource tags to apply
 * @returns Created SNS topic
 */
function createSnsAlertTopic(
    environment: string,
    emailAddresses: string[],
    tags: Record<string, string>
): aws.sns.Topic {
    // Create SNS topic for monitoring alerts
    const alertTopic = new aws.sns.Topic(`${environment}-monitoring-alerts`, {
        displayName: `Revolucare ${environment} Monitoring Alerts`,
        tags: {
            ...tags,
            Name: `${environment}-monitoring-alerts`,
            Component: "Monitoring",
        },
    });

    // Create topic policy for service permissions
    new aws.sns.TopicPolicy(`${environment}-topic-policy`, {
        arn: alertTopic.arn,
        policy: pulumi.output(alertTopic.arn).apply(arn => JSON.stringify({
            Version: "2012-10-17",
            Id: `${environment}-monitoring-alerts-policy`,
            Statement: [
                {
                    Sid: "AllowCloudWatchAlarms",
                    Effect: "Allow",
                    Principal: {
                        Service: "cloudwatch.amazonaws.com"
                    },
                    Action: "sns:Publish",
                    Resource: arn
                },
                {
                    Sid: "AllowSynthetics",
                    Effect: "Allow",
                    Principal: {
                        Service: "synthetics.amazonaws.com"
                    },
                    Action: "sns:Publish",
                    Resource: arn
                }
            ]
        }))
    });

    // Create email subscriptions for each provided email address
    emailAddresses.forEach((email, index) => {
        new aws.sns.TopicSubscription(`${environment}-alert-subscription-${index}`, {
            topic: alertTopic.arn,
            protocol: "email",
            endpoint: email,
            filterPolicy: JSON.stringify({
                severity: ["CRITICAL", "HIGH"]
            }),
            deliveryPolicy: JSON.stringify({
                healthyRetryPolicy: {
                    numRetries: 3,
                    minDelayTarget: 20,
                    maxDelayTarget: 120,
                    numMinDelayRetries: 1,
                    numMaxDelayRetries: 2,
                    numNoDelayRetries: 0,
                    backoffFunction: "exponential"
                }
            })
        });
    });

    return alertTopic;
}

/**
 * Creates CloudWatch log groups for different components with appropriate retention
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Map of created log groups by name
 */
function createCloudWatchLogGroups(
    environment: string,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.LogGroup> {
    // Set retention based on environment
    let retentionInDays: number;
    switch (environment) {
        case "prod":
            retentionInDays = 30;
            break;
        case "staging":
            retentionInDays = 14;
            break;
        default:
            retentionInDays = 7;
            break;
    }

    // Create application log group
    const applicationLogs = new aws.cloudwatch.LogGroup(`${environment}-application-logs`, {
        name: `/revolucare/${environment}/application`,
        retentionInDays,
        tags: {
            ...tags,
            Name: `${environment}-application-logs`,
            Component: "Monitoring",
        },
    });

    // Create API access log group
    const apiAccessLogs = new aws.cloudwatch.LogGroup(`${environment}-api-access-logs`, {
        name: `/revolucare/${environment}/api-access`,
        retentionInDays,
        tags: {
            ...tags,
            Name: `${environment}-api-access-logs`,
            Component: "Monitoring",
        },
    });

    // Create database logs
    const databaseLogs = new aws.cloudwatch.LogGroup(`${environment}-database-logs`, {
        name: `/revolucare/${environment}/database`,
        retentionInDays,
        tags: {
            ...tags,
            Name: `${environment}-database-logs`,
            Component: "Monitoring",
        },
    });

    // Create ECS container logs
    const ecsLogs = new aws.cloudwatch.LogGroup(`${environment}-ecs-logs`, {
        name: `/revolucare/${environment}/ecs`,
        retentionInDays,
        tags: {
            ...tags,
            Name: `${environment}-ecs-logs`,
            Component: "Monitoring",
        },
    });

    // Create audit logs with longer retention
    const auditLogs = new aws.cloudwatch.LogGroup(`${environment}-audit-logs`, {
        name: `/revolucare/${environment}/audit`,
        retentionInDays: environment === "prod" ? 365 : 90, // Longer retention for audit logs
        tags: {
            ...tags,
            Name: `${environment}-audit-logs`,
            Component: "Monitoring",
        },
    });

    return {
        application: applicationLogs,
        apiAccess: apiAccessLogs,
        database: databaseLogs,
        ecs: ecsLogs,
        audit: auditLogs
    };
}

/**
 * Creates CloudWatch dashboards for different user roles and components
 * 
 * @param environment Deployment environment name
 * @param networkOutputs Network infrastructure outputs
 * @param databaseOutputs Database infrastructure outputs
 * @param computeOutputs Compute infrastructure outputs
 * @param storageOutputs Storage infrastructure outputs
 * @param tags Resource tags to apply
 * @returns Map of created dashboards by name
 */
function createCloudWatchDashboards(
    environment: string,
    networkOutputs: NetworkOutputs,
    databaseOutputs: DatabaseOutputs,
    computeOutputs: ComputeOutputs,
    storageOutputs: StorageOutputs,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.Dashboard> {
    const dashboards: Record<string, aws.cloudwatch.Dashboard> = {};

    // Create system overview dashboard
    const systemDashboardBody = {
        widgets: [
            {
                type: "text",
                x: 0,
                y: 0,
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Revolucare ${environment.toUpperCase()} System Overview Dashboard\nLast Updated: ${new Date().toISOString()}`,
                },
            },
            {
                type: "metric",
                x: 0,
                y: 1,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ECS", "CPUUtilization", "ServiceName", computeOutputs.serviceArns.backend.apply(arn => arn.split("/").pop() || ""), "ClusterName", computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || "")],
                        ["AWS/ECS", "CPUUtilization", "ServiceName", computeOutputs.serviceArns.web.apply(arn => arn.split("/").pop() || ""), "ClusterName", computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "ECS Service CPU Utilization",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 6,
                y: 1,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ECS", "MemoryUtilization", "ServiceName", computeOutputs.serviceArns.backend.apply(arn => arn.split("/").pop() || ""), "ClusterName", computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || "")],
                        ["AWS/ECS", "MemoryUtilization", "ServiceName", computeOutputs.serviceArns.web.apply(arn => arn.split("/").pop() || ""), "ClusterName", computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "ECS Service Memory Utilization",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 12,
                y: 1,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                        ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                        ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "ALB Response Codes",
                    period: 300,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 18,
                y: 1,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                        ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", databaseOutputs.redisClusterId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Database CPU Utilization",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 7,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Response Time",
                    period: 300,
                    stat: "p95",
                },
            },
            {
                type: "metric",
                x: 6,
                y: 7,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Database Connections",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 12,
                y: 7,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ElastiCache", "CacheHits", "CacheClusterId", databaseOutputs.redisClusterId],
                        ["AWS/ElastiCache", "CacheMisses", "CacheClusterId", databaseOutputs.redisClusterId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Redis Cache Hits/Misses",
                    period: 300,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 18,
                y: 7,
                width: 6,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/S3", "BucketSizeBytes", "BucketName", storageOutputs.documentBucketName, "StorageType", "StandardStorage"],
                        ["AWS/S3", "BucketSizeBytes", "BucketName", storageOutputs.assetsBucketName, "StorageType", "StandardStorage"],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "S3 Bucket Sizes",
                    period: 86400, // Daily
                    stat: "Average",
                },
            },
        ],
    };

    dashboards.system = new aws.cloudwatch.Dashboard(`${environment}-system-dashboard`, {
        dashboardName: `${environment}-revolucare-system-overview`,
        dashboardBody: JSON.stringify(systemDashboardBody),
        tags: {
            ...tags,
            Name: `${environment}-system-dashboard`,
            Component: "Monitoring",
        },
    });

    // Create application performance dashboard
    const applicationDashboardBody = {
        widgets: [
            {
                type: "text",
                x: 0,
                y: 0,
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Revolucare ${environment.toUpperCase()} Application Performance Dashboard\nLast Updated: ${new Date().toISOString()}`,
                },
            },
            {
                type: "metric",
                x: 0,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Response Time (p95)",
                    period: 60,
                    stat: "p95",
                },
            },
            {
                type: "metric",
                x: 8,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Request Count",
                    period: 60,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 16,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                        ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", computeOutputs.loadBalancerArn.apply(arn => arn.split(":").pop() || "")],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Error Rates",
                    period: 60,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [`Revolucare/${environment}`, "APIResponseTime", "Endpoint", "CarePlan"],
                        [`Revolucare/${environment}`, "APIResponseTime", "Endpoint", "ServicePlan"],
                        [`Revolucare/${environment}`, "APIResponseTime", "Endpoint", "ProviderMatch"],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Critical API Endpoints Response Time",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 8,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [`Revolucare/${environment}`, "ErrorCount"],
                        [`Revolucare/${environment}`, "WarningCount"],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Application Errors and Warnings",
                    period: 300,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 16,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [`Revolucare/${environment}`, "API4xxErrors"],
                        [`Revolucare/${environment}`, "API5xxErrors"],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Error Breakdown",
                    period: 300,
                    stat: "Sum",
                },
            },
        ],
    };

    dashboards.application = new aws.cloudwatch.Dashboard(`${environment}-application-dashboard`, {
        dashboardName: `${environment}-revolucare-application-performance`,
        dashboardBody: JSON.stringify(applicationDashboardBody),
        tags: {
            ...tags,
            Name: `${environment}-application-dashboard`,
            Component: "Monitoring",
        },
    });

    // Create database performance dashboard
    const databaseDashboardBody = {
        widgets: [
            {
                type: "text",
                x: 0,
                y: 0,
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Revolucare ${environment.toUpperCase()} Database Performance Dashboard\nLast Updated: ${new Date().toISOString()}`,
                },
            },
            {
                type: "metric",
                x: 0,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "RDS CPU Utilization",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 8,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "RDS Database Connections",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 16,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "RDS Free Storage Space",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", databaseOutputs.redisClusterId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Redis CPU Utilization",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 8,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ElastiCache", "CacheHitRate", "CacheClusterId", databaseOutputs.redisClusterId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Redis Cache Hit Rate",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 16,
                y: 7,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "CacheClusterId", databaseOutputs.redisClusterId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Redis Memory Usage",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 13,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "ReadLatency", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                        ["AWS/RDS", "WriteLatency", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "RDS Latency",
                    period: 60,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 12,
                y: 13,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        ["AWS/RDS", "ReadIOPS", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                        ["AWS/RDS", "WriteIOPS", "DBInstanceIdentifier", databaseOutputs.rdsInstanceId],
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "RDS IOPS",
                    period: 60,
                    stat: "Average",
                },
            },
        ],
    };

    dashboards.database = new aws.cloudwatch.Dashboard(`${environment}-database-dashboard`, {
        dashboardName: `${environment}-revolucare-database-performance`,
        dashboardBody: JSON.stringify(databaseDashboardBody),
        tags: {
            ...tags,
            Name: `${environment}-database-dashboard`,
            Component: "Monitoring",
        },
    });

    // Create business metrics dashboard
    const businessDashboardBody = {
        widgets: [
            {
                type: "text",
                x: 0,
                y: 0,
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Revolucare ${environment.toUpperCase()} Business Metrics Dashboard\nLast Updated: ${new Date().toISOString()}`,
                },
            },
            {
                type: "metric",
                x: 0,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [ { "expression": "SUM(METRICS())", "label": "Total User Sessions", "id": "e1" } ],
                        [ "Revolucare/UserMetrics", "UserSessions", "UserType", "Client" ],
                        [ "Revolucare/UserMetrics", "UserSessions", "UserType", "Provider" ],
                        [ "Revolucare/UserMetrics", "UserSessions", "UserType", "CaseManager" ],
                        [ "Revolucare/UserMetrics", "UserSessions", "UserType", "Administrator" ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "User Sessions by Role",
                    period: 3600,
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 8,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/BusinessMetrics", "CarePlansCreated" ],
                        [ "Revolucare/BusinessMetrics", "ServicePlansCreated" ],
                        [ "Revolucare/BusinessMetrics", "ProviderMatches" ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Care Plan Activity",
                    period: 86400, // Daily
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 16,
                y: 1,
                width: 8,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/BusinessMetrics", "APIResponseTime", "Endpoint", "CarePlan" ],
                        [ "Revolucare/BusinessMetrics", "APIResponseTime", "Endpoint", "ProviderMatch" ],
                        [ "Revolucare/BusinessMetrics", "APIResponseTime", "Endpoint", "ServicePlan" ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Critical Business API Performance",
                    period: 300,
                    stat: "Average",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 7,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/BusinessMetrics", "UserSignups" ],
                        [ "Revolucare/BusinessMetrics", "UserActivations" ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "User Growth Metrics",
                    period: 86400, // Daily
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 12,
                y: 7,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ { "expression": "m2/m1*100", "label": "Matching Success Rate (%)", "id": "e1" } ],
                        [ "Revolucare/BusinessMetrics", "ProviderMatchAttempts", { "id": "m1", "visible": false } ],
                        [ "Revolucare/BusinessMetrics", "ProviderMatchSuccess", { "id": "m2", "visible": false } ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Provider Matching Success Rate",
                    period: 86400, // Daily
                    stat: "Sum",
                },
            },
            {
                type: "metric",
                x: 0,
                y: 13,
                width: 24,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "SLAComplianceRate", "ServiceType", "CarePlanGeneration" ],
                        [ "Revolucare/SLAMetrics", "SLAComplianceRate", "ServiceType", "ProviderMatching" ],
                        [ "Revolucare/SLAMetrics", "SLAComplianceRate", "ServiceType", "APIResponse" ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "SLA Compliance Rates",
                    period: 3600, // Hourly
                    stat: "Average",
                    yAxis: {
                        left: {
                            min: 80,
                            max: 100
                        }
                    }
                },
            },
        ],
    };

    dashboards.business = new aws.cloudwatch.Dashboard(`${environment}-business-dashboard`, {
        dashboardName: `${environment}-revolucare-business-metrics`,
        dashboardBody: JSON.stringify(businessDashboardBody),
        tags: {
            ...tags,
            Name: `${environment}-business-dashboard`,
            Component: "Monitoring",
        },
    });

    // Create SLA monitoring dashboard
    const slaDashboardBody = {
        widgets: [
            {
                type: "text",
                x: 0,
                y: 0,
                width: 24,
                height: 1,
                properties: {
                    markdown: `# Revolucare ${environment.toUpperCase()} SLA Monitoring Dashboard\nLast Updated: ${new Date().toISOString()}`,
                },
            },
            {
                type: "metric",
                x: 0,
                y: 1,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "APIResponseTime", "Percentile", "p95" ],
                        [ "Revolucare/SLAMetrics", "APIResponseTime", "Percentile", "p99" ],
                        [ { "expression": "ANOMALY_DETECTION_BAND(m1, 2)", "label": "p95 Expected Range", "id": "ad1" } ],
                        [ "Revolucare/SLAMetrics", "APIResponseTime", "Percentile", "p95", { "id": "m1", "visible": false } ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "API Response Time SLA",
                    period: 300,
                    stat: "Average",
                    annotations: {
                        horizontal: [
                            {
                                label: "SLA Threshold",
                                value: 500,
                                color: "#ff0000"
                            }
                        ]
                    }
                },
            },
            {
                type: "metric",
                x: 12,
                y: 1,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "CarePlanGenerationTime" ],
                        [ { "expression": "ANOMALY_DETECTION_BAND(m1, 2)", "label": "Expected Range", "id": "ad1" } ],
                        [ "Revolucare/SLAMetrics", "CarePlanGenerationTime", { "id": "m1", "visible": false } ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Care Plan Generation Time SLA",
                    period: 300,
                    stat: "Average",
                    annotations: {
                        horizontal: [
                            {
                                label: "SLA Threshold",
                                value: 30000,
                                color: "#ff0000"
                            }
                        ]
                    }
                },
            },
            {
                type: "metric",
                x: 0,
                y: 7,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "ProviderMatchingTime" ],
                        [ { "expression": "ANOMALY_DETECTION_BAND(m1, 2)", "label": "Expected Range", "id": "ad1" } ],
                        [ "Revolucare/SLAMetrics", "ProviderMatchingTime", { "id": "m1", "visible": false } ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Provider Matching Time SLA",
                    period: 300,
                    stat: "Average",
                    annotations: {
                        horizontal: [
                            {
                                label: "SLA Threshold",
                                value: 2000,
                                color: "#ff0000"
                            }
                        ]
                    }
                },
            },
            {
                type: "metric",
                x: 12,
                y: 7,
                width: 12,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "DocumentProcessingTime" ],
                        [ { "expression": "ANOMALY_DETECTION_BAND(m1, 2)", "label": "Expected Range", "id": "ad1" } ],
                        [ "Revolucare/SLAMetrics", "DocumentProcessingTime", { "id": "m1", "visible": false } ]
                    ],
                    view: "timeSeries",
                    stacked: false,
                    region: aws.config.region || "us-east-1",
                    title: "Document Processing Time SLA",
                    period: 300,
                    stat: "Average",
                    annotations: {
                        horizontal: [
                            {
                                label: "SLA Threshold",
                                value: 60000,
                                color: "#ff0000"
                            }
                        ]
                    }
                },
            },
            {
                type: "metric",
                x: 0,
                y: 13,
                width: 24,
                height: 6,
                properties: {
                    metrics: [
                        [ "Revolucare/SLAMetrics", "SLAViolationCount", "ServiceType", "CarePlanGeneration" ],
                        [ "Revolucare/SLAMetrics", "SLAViolationCount", "ServiceType", "ProviderMatching" ],
                        [ "Revolucare/SLAMetrics", "SLAViolationCount", "ServiceType", "APIResponse" ],
                        [ "Revolucare/SLAMetrics", "SLAViolationCount", "ServiceType", "DocumentProcessing" ]
                    ],
                    view: "timeSeries",
                    stacked: true,
                    region: aws.config.region || "us-east-1",
                    title: "SLA Violations",
                    period: 3600, // Hourly
                    stat: "Sum"
                },
            },
        ],
    };

    dashboards.sla = new aws.cloudwatch.Dashboard(`${environment}-sla-dashboard`, {
        dashboardName: `${environment}-revolucare-sla-monitoring`,
        dashboardBody: JSON.stringify(slaDashboardBody),
        tags: {
            ...tags,
            Name: `${environment}-sla-dashboard`,
            Component: "Monitoring",
        },
    });

    return dashboards;
}

/**
 * Creates CloudWatch alarms for critical metrics with appropriate thresholds
 * 
 * @param environment Deployment environment name
 * @param alertTopic SNS topic for alarm notifications
 * @param databaseOutputs Database infrastructure outputs
 * @param computeOutputs Compute infrastructure outputs
 * @param storageOutputs Storage infrastructure outputs
 * @param tags Resource tags to apply
 * @returns Map of created alarms by name
 */
function createCloudWatchAlarms(
    environment: string,
    alertTopic: aws.sns.Topic,
    databaseOutputs: DatabaseOutputs,
    computeOutputs: ComputeOutputs,
    storageOutputs: StorageOutputs,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.MetricAlarm> {
    const alarms: Record<string, aws.cloudwatch.MetricAlarm> = {};
    
    // Get appropriate thresholds based on environment
    const thresholds = createAlarmThresholds(environment);
    
    // CPU Utilization Alarm for ECS Services
    alarms.ecsBackendCpuAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-ecs-backend-cpu-alarm`, {
        alarmName: `${environment}-revolucare-backend-cpu-high`,
        alarmDescription: `CPU utilization exceeded ${thresholds.ecsBackendCpu.critical}% for backend service | Runbook: https://revolucare.com/runbooks/high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.ecsBackendCpu.evaluationPeriods,
        datapointsToAlarm: thresholds.ecsBackendCpu.datapointsToAlarm,
        threshold: thresholds.ecsBackendCpu.critical,
        treatMissingData: "missing",
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 60,
        statistic: "Average",
        dimensions: {
            ClusterName: computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || ""),
            ServiceName: computeOutputs.serviceArns.backend.apply(arn => arn.split("/").pop() || ""),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-ecs-backend-cpu-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.ecsWebCpuAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-ecs-web-cpu-alarm`, {
        alarmName: `${environment}-revolucare-web-cpu-high`,
        alarmDescription: `CPU utilization exceeded ${thresholds.ecsWebCpu.critical}% for web service | Runbook: https://revolucare.com/runbooks/high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.ecsWebCpu.evaluationPeriods,
        datapointsToAlarm: thresholds.ecsWebCpu.datapointsToAlarm,
        threshold: thresholds.ecsWebCpu.critical,
        treatMissingData: "missing",
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 60,
        statistic: "Average",
        dimensions: {
            ClusterName: computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || ""),
            ServiceName: computeOutputs.serviceArns.web.apply(arn => arn.split("/").pop() || ""),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-ecs-web-cpu-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    // Memory Utilization Alarm for ECS Services
    alarms.ecsBackendMemoryAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-ecs-backend-memory-alarm`, {
        alarmName: `${environment}-revolucare-backend-memory-high`,
        alarmDescription: `Memory utilization exceeded ${thresholds.ecsBackendMemory.critical}% for backend service | Runbook: https://revolucare.com/runbooks/high-memory`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.ecsBackendMemory.evaluationPeriods,
        datapointsToAlarm: thresholds.ecsBackendMemory.datapointsToAlarm,
        threshold: thresholds.ecsBackendMemory.critical,
        treatMissingData: "missing",
        metricName: "MemoryUtilization",
        namespace: "AWS/ECS",
        period: 60,
        statistic: "Average",
        dimensions: {
            ClusterName: computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || ""),
            ServiceName: computeOutputs.serviceArns.backend.apply(arn => arn.split("/").pop() || ""),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-ecs-backend-memory-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.ecsWebMemoryAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-ecs-web-memory-alarm`, {
        alarmName: `${environment}-revolucare-web-memory-high`,
        alarmDescription: `Memory utilization exceeded ${thresholds.ecsWebMemory.critical}% for web service | Runbook: https://revolucare.com/runbooks/high-memory`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.ecsWebMemory.evaluationPeriods,
        datapointsToAlarm: thresholds.ecsWebMemory.datapointsToAlarm,
        threshold: thresholds.ecsWebMemory.critical,
        treatMissingData: "missing",
        metricName: "MemoryUtilization",
        namespace: "AWS/ECS",
        period: 60,
        statistic: "Average",
        dimensions: {
            ClusterName: computeOutputs.ecsClusterArn.apply(arn => arn.split("/").pop() || ""),
            ServiceName: computeOutputs.serviceArns.web.apply(arn => arn.split("/").pop() || ""),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-ecs-web-memory-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    // RDS Database Alarms
    alarms.rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-rds-cpu-alarm`, {
        alarmName: `${environment}-revolucare-rds-cpu-high`,
        alarmDescription: `CPU utilization exceeded ${thresholds.rdsCpu.critical}% for RDS instance | Runbook: https://revolucare.com/runbooks/rds-high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.rdsCpu.evaluationPeriods,
        datapointsToAlarm: thresholds.rdsCpu.datapointsToAlarm,
        threshold: thresholds.rdsCpu.critical,
        treatMissingData: "missing",
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 60,
        statistic: "Average",
        dimensions: {
            DBInstanceIdentifier: databaseOutputs.rdsInstanceId,
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-rds-cpu-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.rdsConnectionsAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-rds-connections-alarm`, {
        alarmName: `${environment}-revolucare-rds-connections-high`,
        alarmDescription: `Database connections exceeded ${thresholds.rdsConnections.critical} for RDS instance | Runbook: https://revolucare.com/runbooks/rds-connections`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.rdsConnections.evaluationPeriods,
        datapointsToAlarm: thresholds.rdsConnections.datapointsToAlarm,
        threshold: thresholds.rdsConnections.critical,
        treatMissingData: "missing",
        metricName: "DatabaseConnections",
        namespace: "AWS/RDS",
        period: 60,
        statistic: "Average",
        dimensions: {
            DBInstanceIdentifier: databaseOutputs.rdsInstanceId,
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-rds-connections-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.rdsStorageAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-rds-storage-alarm`, {
        alarmName: `${environment}-revolucare-rds-storage-low`,
        alarmDescription: `Free storage space below ${thresholds.rdsStorage.critical}MB for RDS instance | Runbook: https://revolucare.com/runbooks/rds-storage`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: thresholds.rdsStorage.evaluationPeriods,
        datapointsToAlarm: thresholds.rdsStorage.datapointsToAlarm,
        threshold: thresholds.rdsStorage.critical,
        treatMissingData: "missing",
        metricName: "FreeStorageSpace",
        namespace: "AWS/RDS",
        period: 60,
        statistic: "Average",
        dimensions: {
            DBInstanceIdentifier: databaseOutputs.rdsInstanceId,
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-rds-storage-alarm`,
            Component: "Monitoring",
            Severity: "CRITICAL",
        },
    });
    
    // Redis Cache Alarms
    alarms.redisCpuAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-redis-cpu-alarm`, {
        alarmName: `${environment}-revolucare-redis-cpu-high`,
        alarmDescription: `CPU utilization exceeded ${thresholds.redisCpu.critical}% for Redis cluster | Runbook: https://revolucare.com/runbooks/redis-high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.redisCpu.evaluationPeriods,
        datapointsToAlarm: thresholds.redisCpu.datapointsToAlarm,
        threshold: thresholds.redisCpu.critical,
        treatMissingData: "missing",
        metricName: "CPUUtilization",
        namespace: "AWS/ElastiCache",
        period: 60,
        statistic: "Average",
        dimensions: {
            CacheClusterId: databaseOutputs.redisClusterId,
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-redis-cpu-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.redisMemoryAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-redis-memory-alarm`, {
        alarmName: `${environment}-revolucare-redis-memory-high`,
        alarmDescription: `Memory usage exceeded ${thresholds.redisMemory.critical}% for Redis cluster | Runbook: https://revolucare.com/runbooks/redis-memory`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.redisMemory.evaluationPeriods,
        datapointsToAlarm: thresholds.redisMemory.datapointsToAlarm,
        threshold: thresholds.redisMemory.critical,
        treatMissingData: "missing",
        metricName: "DatabaseMemoryUsagePercentage",
        namespace: "AWS/ElastiCache",
        period: 60,
        statistic: "Average",
        dimensions: {
            CacheClusterId: databaseOutputs.redisClusterId,
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-redis-memory-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    // API Performance Alarms
    alarms.apiLatencyAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-api-latency-alarm`, {
        alarmName: `${environment}-revolucare-api-latency-high`,
        alarmDescription: `API latency exceeded ${thresholds.apiLatency.critical}ms (p95) | Runbook: https://revolucare.com/runbooks/api-latency`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.apiLatency.evaluationPeriods,
        datapointsToAlarm: thresholds.apiLatency.datapointsToAlarm,
        threshold: thresholds.apiLatency.critical,
        treatMissingData: "missing",
        metricName: "TargetResponseTime",
        namespace: "AWS/ApplicationELB",
        period: 60,
        extendedStatistic: "p95",
        dimensions: {
            LoadBalancer: computeOutputs.loadBalancerArn.apply(arn => arn.split(":")[5].split("/")[1]),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-api-latency-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    alarms.api5xxErrorAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-api-5xx-alarm`, {
        alarmName: `${environment}-revolucare-api-5xx-errors`,
        alarmDescription: `5XX errors exceeded ${thresholds.api5xxErrors.critical} in 5 minutes | Runbook: https://revolucare.com/runbooks/api-5xx`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.api5xxErrors.evaluationPeriods,
        datapointsToAlarm: thresholds.api5xxErrors.datapointsToAlarm,
        threshold: thresholds.api5xxErrors.critical,
        treatMissingData: "notBreaching",
        metricName: "HTTPCode_Target_5XX_Count",
        namespace: "AWS/ApplicationELB",
        period: 300,
        statistic: "Sum",
        dimensions: {
            LoadBalancer: computeOutputs.loadBalancerArn.apply(arn => arn.split(":")[5].split("/")[1]),
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-api-5xx-alarm`,
            Component: "Monitoring",
            Severity: "CRITICAL",
        },
    });
    
    // S3 bucket size/usage alarms
    alarms.documentBucketSizeAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-document-bucket-size-alarm`, {
        alarmName: `${environment}-revolucare-document-bucket-size-high`,
        alarmDescription: `Document bucket size exceeded ${thresholds.s3BucketSize.critical} bytes | Runbook: https://revolucare.com/runbooks/s3-size`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.s3BucketSize.evaluationPeriods,
        datapointsToAlarm: thresholds.s3BucketSize.datapointsToAlarm,
        threshold: thresholds.s3BucketSize.critical,
        treatMissingData: "missing",
        metricName: "BucketSizeBytes",
        namespace: "AWS/S3",
        period: 86400, // Daily
        statistic: "Average",
        dimensions: {
            BucketName: storageOutputs.documentBucketName,
            StorageType: "StandardStorage",
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-document-bucket-size-alarm`,
            Component: "Monitoring",
            Severity: "MEDIUM",
        },
    });
    
    // CloudFront alarms
    alarms.cdnErrorRateAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-cdn-error-rate-alarm`, {
        alarmName: `${environment}-revolucare-cdn-error-rate-high`,
        alarmDescription: `CDN error rate exceeded ${thresholds.cdnErrorRate.critical}% | Runbook: https://revolucare.com/runbooks/cdn-errors`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: thresholds.cdnErrorRate.evaluationPeriods,
        datapointsToAlarm: thresholds.cdnErrorRate.datapointsToAlarm,
        threshold: thresholds.cdnErrorRate.critical,
        treatMissingData: "missing",
        metricName: "5xxErrorRate",
        namespace: "AWS/CloudFront",
        period: 300,
        statistic: "Average",
        dimensions: {
            DistributionId: storageOutputs.cdnDistributionId,
            Region: "Global",
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-cdn-error-rate-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    // Add SLA monitoring alarms
    alarms.slaApiResponseAlarm = new aws.cloudwatch.MetricAlarm(`${environment}-sla-api-response-alarm`, {
        alarmName: `${environment}-revolucare-sla-api-response`,
        alarmDescription: `API response time SLA violation detected | Runbook: https://revolucare.com/runbooks/sla-violation`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        threshold: 1, // Just needs any breach
        treatMissingData: "missing",
        metricName: "SLAViolationCount",
        namespace: "Revolucare/SLAMetrics",
        period: 300,
        statistic: "Sum",
        dimensions: {
            ServiceType: "APIResponse",
        },
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-sla-api-response-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    return alarms;
}

/**
 * Creates CloudWatch metric filters for extracting metrics from logs
 * 
 * @param environment Deployment environment name
 * @param logGroups Map of log groups by name
 * @param tags Resource tags to apply
 * @returns Map of created metric filters by name
 */
function createMetricFilters(
    environment: string,
    logGroups: Record<string, aws.cloudwatch.LogGroup>,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.MetricFilter> {
    const metricFilters: Record<string, aws.cloudwatch.MetricFilter> = {};
    
    // Error log metric filter
    metricFilters.errorLogs = new aws.cloudwatch.MetricFilter(`${environment}-error-logs-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-error-logs`,
        pattern: "ERROR",
        metricTransformation: {
            name: "ErrorCount",
            namespace: `Revolucare/${environment}`,
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    // Warning log metric filter
    metricFilters.warningLogs = new aws.cloudwatch.MetricFilter(`${environment}-warning-logs-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-warning-logs`,
        pattern: "WARN",
        metricTransformation: {
            name: "WarningCount",
            namespace: `Revolucare/${environment}`,
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    // API access log metric filter for response time
    metricFilters.apiResponseTime = new aws.cloudwatch.MetricFilter(`${environment}-api-response-time-metric`, {
        logGroupName: logGroups.apiAccess.name,
        name: `${environment}-revolucare-api-response-time`,
        pattern: "[time, method, path, status, responseTime]",
        metricTransformation: {
            name: "APIResponseTime",
            namespace: `Revolucare/${environment}`,
            value: "$responseTime",
            defaultValue: 0,
            unit: "Milliseconds",
        },
    });
    
    // API access log metric filter for 4xx errors
    metricFilters.api4xxErrors = new aws.cloudwatch.MetricFilter(`${environment}-api-4xx-errors-metric`, {
        logGroupName: logGroups.apiAccess.name,
        name: `${environment}-revolucare-api-4xx-errors`,
        pattern: "[time, method, path, status=4*, responseTime]",
        metricTransformation: {
            name: "API4xxErrors",
            namespace: `Revolucare/${environment}`,
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    // API access log metric filter for 5xx errors
    metricFilters.api5xxErrors = new aws.cloudwatch.MetricFilter(`${environment}-api-5xx-errors-metric`, {
        logGroupName: logGroups.apiAccess.name,
        name: `${environment}-revolucare-api-5xx-errors`,
        pattern: "[time, method, path, status=5*, responseTime]",
        metricTransformation: {
            name: "API5xxErrors",
            namespace: `Revolucare/${environment}`,
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    // Business metric filters
    metricFilters.carePlanCreation = new aws.cloudwatch.MetricFilter(`${environment}-care-plan-creation-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-care-plan-creation`,
        pattern: "BUSINESS_METRIC carePlanCreated",
        metricTransformation: {
            name: "CarePlansCreated",
            namespace: "Revolucare/BusinessMetrics",
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    metricFilters.providerMatch = new aws.cloudwatch.MetricFilter(`${environment}-provider-match-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-provider-match`,
        pattern: "BUSINESS_METRIC providerMatched",
        metricTransformation: {
            name: "ProviderMatches",
            namespace: "Revolucare/BusinessMetrics",
            value: "1",
            defaultValue: 0,
            unit: "Count",
        },
    });
    
    // SLA monitoring metrics
    metricFilters.slaApiViolation = new aws.cloudwatch.MetricFilter(`${environment}-sla-api-violation-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-sla-api-violation`,
        pattern: "SLA_VIOLATION APIResponse responseTime > ?threshold",
        metricTransformation: {
            name: "SLAViolationCount",
            namespace: "Revolucare/SLAMetrics",
            value: "1",
            defaultValue: 0,
            unit: "Count",
            dimensions: {
                ServiceType: "APIResponse"
            }
        },
    });
    
    metricFilters.slaCarePlanViolation = new aws.cloudwatch.MetricFilter(`${environment}-sla-care-plan-violation-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-sla-care-plan-violation`,
        pattern: "SLA_VIOLATION CarePlanGeneration processingTime > ?threshold",
        metricTransformation: {
            name: "SLAViolationCount",
            namespace: "Revolucare/SLAMetrics",
            value: "1",
            defaultValue: 0,
            unit: "Count",
            dimensions: {
                ServiceType: "CarePlanGeneration"
            }
        },
    });
    
    metricFilters.slaProviderMatchViolation = new aws.cloudwatch.MetricFilter(`${environment}-sla-provider-match-violation-metric`, {
        logGroupName: logGroups.application.name,
        name: `${environment}-revolucare-sla-provider-match-violation`,
        pattern: "SLA_VIOLATION ProviderMatching matchTime > ?threshold",
        metricTransformation: {
            name: "SLAViolationCount",
            namespace: "Revolucare/SLAMetrics",
            value: "1",
            defaultValue: 0,
            unit: "Count",
            dimensions: {
                ServiceType: "ProviderMatching"
            }
        },
    });
    
    return metricFilters;
}

/**
 * Creates CloudWatch composite alarms for complex conditions
 * 
 * @param environment Deployment environment name
 * @param alarms Map of metric alarms
 * @param alertTopic SNS topic for alarm notifications
 * @param tags Resource tags to apply
 * @returns Map of created composite alarms by name
 */
function createCompositeAlarms(
    environment: string,
    alarms: Record<string, aws.cloudwatch.MetricAlarm>,
    alertTopic: aws.sns.Topic,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.CompositeAlarm> {
    const compositeAlarms: Record<string, aws.cloudwatch.CompositeAlarm> = {};
    
    // System health composite alarm
    compositeAlarms.systemHealth = new aws.cloudwatch.CompositeAlarm(`${environment}-system-health-alarm`, {
        alarmName: `${environment}-revolucare-system-health`,
        alarmDescription: "Composite alarm for overall system health | Runbook: https://revolucare.com/runbooks/system-health",
        alarmRule: pulumi.interpolate`(ALARM("${alarms.ecsBackendCpuAlarm.alarmName}") OR ALARM("${alarms.ecsWebCpuAlarm.alarmName}") OR ALARM("${alarms.ecsBackendMemoryAlarm.alarmName}") OR ALARM("${alarms.ecsWebMemoryAlarm.alarmName}")) OR (ALARM("${alarms.api5xxErrorAlarm.alarmName}"))`,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-system-health-alarm`,
            Component: "Monitoring",
            Severity: "CRITICAL",
        },
    });
    
    // Database health composite alarm
    compositeAlarms.databaseHealth = new aws.cloudwatch.CompositeAlarm(`${environment}-database-health-alarm`, {
        alarmName: `${environment}-revolucare-database-health`,
        alarmDescription: "Composite alarm for overall database health | Runbook: https://revolucare.com/runbooks/database-health",
        alarmRule: pulumi.interpolate`(ALARM("${alarms.rdsCpuAlarm.alarmName}") OR ALARM("${alarms.rdsConnectionsAlarm.alarmName}") OR ALARM("${alarms.rdsStorageAlarm.alarmName}")) OR (ALARM("${alarms.redisCpuAlarm.alarmName}") OR ALARM("${alarms.redisMemoryAlarm.alarmName}"))`,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-database-health-alarm`,
            Component: "Monitoring",
            Severity: "CRITICAL",
        },
    });
    
    // API health composite alarm
    compositeAlarms.apiHealth = new aws.cloudwatch.CompositeAlarm(`${environment}-api-health-alarm`, {
        alarmName: `${environment}-revolucare-api-health`,
        alarmDescription: "Composite alarm for overall API health | Runbook: https://revolucare.com/runbooks/api-health",
        alarmRule: pulumi.interpolate`ALARM("${alarms.apiLatencyAlarm.alarmName}") OR ALARM("${alarms.api5xxErrorAlarm.alarmName}")`,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-api-health-alarm`,
            Component: "Monitoring",
            Severity: "CRITICAL",
        },
    });
    
    // SLA compliance composite alarm
    compositeAlarms.slaCompliance = new aws.cloudwatch.CompositeAlarm(`${environment}-sla-compliance-alarm`, {
        alarmName: `${environment}-revolucare-sla-compliance`,
        alarmDescription: "Composite alarm for SLA compliance across services | Runbook: https://revolucare.com/runbooks/sla-compliance",
        alarmRule: pulumi.interpolate`ALARM("${alarms.slaApiResponseAlarm.alarmName}")`,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        tags: {
            ...tags,
            Name: `${environment}-sla-compliance-alarm`,
            Component: "Monitoring",
            Severity: "HIGH",
        },
    });
    
    return compositeAlarms;
}

/**
 * Creates CloudWatch Synthetics canaries for endpoint monitoring
 * 
 * @param environment Deployment environment name
 * @param executionRoleArn ARN of the execution role for canaries
 * @param tags Resource tags to apply
 * @returns Map of created canaries by name
 */
function createSyntheticsCanaries(
    environment: string,
    executionRoleArn: string,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.Canary> {
    const canaries: Record<string, aws.cloudwatch.Canary> = {};
    
    // Determine execution frequency based on environment
    const scheduleExpression = environment === "prod" ? "rate(5 minutes)" : "rate(15 minutes)";
    
    // Health check canary
    canaries.healthCheck = new aws.cloudwatch.Canary(`${environment}-health-check-canary`, {
        name: `${environment}-revolucare-health-check`,
        artifactS3Location: `s3://revolucare-${environment}-monitoring/canaries/health-check`,
        executionRoleArn: executionRoleArn,
        handler: "healthCheck.handler",
        runtimeVersion: "syn-nodejs-puppeteer-3.8",
        schedule: {
            expression: scheduleExpression,
        },
        startCanary: true,
        s3Bucket: `revolucare-${environment}-monitoring`,
        s3Key: "canaries/health-check/healthCheck.zip",
        successRetentionPeriod: 7,
        failureRetentionPeriod: 14,
        runConfig: {
            timeoutInSeconds: 60,
            memoryInMb: 1024,
            activeTracing: true,
        },
        tags: {
            ...tags,
            Name: `${environment}-health-check-canary`,
            Component: "Monitoring",
        },
    });
    
    // Critical path canary
    canaries.criticalPath = new aws.cloudwatch.Canary(`${environment}-critical-path-canary`, {
        name: `${environment}-revolucare-critical-path`,
        artifactS3Location: `s3://revolucare-${environment}-monitoring/canaries/critical-path`,
        executionRoleArn: executionRoleArn,
        handler: "criticalPath.handler",
        runtimeVersion: "syn-nodejs-puppeteer-3.8",
        schedule: {
            expression: scheduleExpression,
        },
        startCanary: true,
        s3Bucket: `revolucare-${environment}-monitoring`,
        s3Key: "canaries/critical-path/criticalPath.zip",
        successRetentionPeriod: 7,
        failureRetentionPeriod: 14,
        runConfig: {
            timeoutInSeconds: 120,
            memoryInMb: 2048,
            activeTracing: true,
            environmentVariables: {
                TEST_ENDPOINT: `https://api.revolucare-${environment}.com`,
                ENVIRONMENT: environment
            }
        },
        tags: {
            ...tags,
            Name: `${environment}-critical-path-canary`,
            Component: "Monitoring",
        },
    });
    
    // Authentication flow canary
    canaries.authFlow = new aws.cloudwatch.Canary(`${environment}-auth-flow-canary`, {
        name: `${environment}-revolucare-auth-flow`,
        artifactS3Location: `s3://revolucare-${environment}-monitoring/canaries/auth-flow`,
        executionRoleArn: executionRoleArn,
        handler: "authFlow.handler",
        runtimeVersion: "syn-nodejs-puppeteer-3.8",
        schedule: {
            expression: scheduleExpression,
        },
        startCanary: true,
        s3Bucket: `revolucare-${environment}-monitoring`,
        s3Key: "canaries/auth-flow/authFlow.zip",
        successRetentionPeriod: 7,
        failureRetentionPeriod: 14,
        runConfig: {
            timeoutInSeconds: 90,
            memoryInMb: 1024,
            activeTracing: true,
            environmentVariables: {
                TEST_USERNAME: `test-user@revolucare-${environment}.com`,
                // Note: Password would come from a secure parameter store in practice
                ENVIRONMENT: environment
            }
        },
        tags: {
            ...tags,
            Name: `${environment}-auth-flow-canary`,
            Component: "Monitoring",
        },
    });
    
    return canaries;
}

/**
 * Creates CloudWatch Insights queries for common scenarios
 * 
 * @param environment Deployment environment name
 * @param logGroups Map of log groups by name
 * @param tags Resource tags to apply
 * @returns Map of created query definitions by name
 */
function createCloudWatchInsightsQueries(
    environment: string,
    logGroups: Record<string, aws.cloudwatch.LogGroup>,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.QueryDefinition> {
    const queries: Record<string, aws.cloudwatch.QueryDefinition> = {};
    
    // Error analysis query
    queries.errorAnalysis = new aws.cloudwatch.QueryDefinition(`${environment}-error-analysis-query`, {
        name: `${environment}-revolucare-error-analysis`,
        queryString: `
            fields @timestamp, @message
            | filter level="ERROR"
            | sort @timestamp desc
            | limit 100
        `,
        logGroupNames: [logGroups.application.name],
    });
    
    // Slow API requests query
    queries.slowApiRequests = new aws.cloudwatch.QueryDefinition(`${environment}-slow-api-requests-query`, {
        name: `${environment}-revolucare-slow-api-requests`,
        queryString: `
            fields @timestamp, method, path, status, responseTime
            | filter responseTime > 1000
            | sort responseTime desc
            | limit 100
        `,
        logGroupNames: [logGroups.apiAccess.name],
    });
    
    // Authentication failures query
    queries.authFailures = new aws.cloudwatch.QueryDefinition(`${environment}-auth-failures-query`, {
        name: `${environment}-revolucare-auth-failures`,
        queryString: `
            fields @timestamp, @message, userId, reason
            | filter level="ERROR" and strcontains(@message, "authentication failed")
            | sort @timestamp desc
            | stats count() by reason, bin(5m)
            | limit 100
        `,
        logGroupNames: [logGroups.application.name],
    });
    
    // Database performance query
    queries.databasePerformance = new aws.cloudwatch.QueryDefinition(`${environment}-database-performance-query`, {
        name: `${environment}-revolucare-database-performance`,
        queryString: `
            fields @timestamp, @message, query, duration
            | filter level="INFO" and strcontains(@message, "query execution")
            | filter duration > 100
            | sort duration desc
            | limit 100
        `,
        logGroupNames: [logGroups.database.name],
    });
    
    // SLA violations query
    queries.slaViolations = new aws.cloudwatch.QueryDefinition(`${environment}-sla-violations-query`, {
        name: `${environment}-revolucare-sla-violations`,
        queryString: `
            fields @timestamp, @message, serviceType, thresholdValue, actualValue
            | filter strcontains(@message, "SLA_VIOLATION")
            | sort @timestamp desc
            | stats count() as violationCount by serviceType, bin(1h) as hourly
            | sort violationCount desc
        `,
        logGroupNames: [logGroups.application.name],
    });
    
    return queries;
}

/**
 * Creates AWS Managed Prometheus workspace and resources
 * 
 * @param environment Deployment environment name
 * @param vpcId ID of the VPC
 * @param subnetIds IDs of private subnets
 * @param securityGroupId Security group ID for Prometheus
 * @param tags Resource tags to apply
 * @returns Prometheus resources including workspace and scraper
 */
function createPrometheusResources(
    environment: string,
    vpcId: string,
    subnetIds: string[],
    securityGroupId: string,
    tags: Record<string, string>
): { workspaceId: string; endpoint: string } {
    // Create Amazon Managed Service for Prometheus workspace
    const prometheusWorkspace = new aws.amp.Workspace(`${environment}-prometheus-workspace`, {
        alias: `revolucare-${environment}`,
        tags: {
            ...tags,
            Name: `${environment}-prometheus-workspace`,
            Component: "Monitoring",
        },
    });
    
    // Create VPC endpoint for AWS Managed Prometheus (requires PrivateLink)
    const prometheusVpcEndpoint = new aws.ec2.VpcEndpoint(`${environment}-prometheus-vpce`, {
        vpcId: vpcId,
        serviceName: `com.amazonaws.${aws.config.region}.aps-workspaces`,
        vpcEndpointType: "Interface",
        subnetIds: subnetIds,
        securityGroupIds: [securityGroupId],
        privateDnsEnabled: true,
        tags: {
            ...tags,
            Name: `${environment}-prometheus-vpce`,
            Component: "Monitoring",
        },
    });
    
    return {
        workspaceId: prometheusWorkspace.id,
        endpoint: prometheusWorkspace.prometheusEndpoint,
    };
}

/**
 * Creates AWS Managed Grafana workspace and resources
 * 
 * @param environment Deployment environment name
 * @param prometheusWorkspaceId ID of the Prometheus workspace
 * @param userEmails Email addresses for user access
 * @param tags Resource tags to apply
 * @returns Grafana resources including workspace and dashboards
 */
function createGrafanaResources(
    environment: string,
    prometheusWorkspaceId: string,
    userEmails: string[],
    tags: Record<string, string>
): { workspaceId: string; endpoint: string } {
    // Create Amazon Managed Grafana workspace
    const grafanaWorkspace = new aws.grafana.Workspace(`${environment}-grafana-workspace`, {
        accountAccessType: "CURRENT_ACCOUNT",
        authenticationProviders: ["AWS_SSO"],
        permissionType: "SERVICE_MANAGED",
        name: `revolucare-${environment}`,
        dataSources: ["CLOUDWATCH", "PROMETHEUS"],
        notificationDestinations: ["SNS"],
        stackSetName: `revolucare-${environment}-grafana`,
        tags: {
            ...tags,
            Name: `${environment}-grafana-workspace`,
            Component: "Monitoring",
        },
    });
    
    // Add user associations for the provided email addresses
    userEmails.forEach((email, index) => {
        new aws.grafana.WorkspaceIamUserAssociation(`${environment}-grafana-user-${index}`, {
            userType: "SSO_USER",
            userName: email,
            workspaceId: grafanaWorkspace.id,
        });
    });
    
    // Create Prometheus data source (AWS Managed Prometheus)
    const prometheusDataSource = new aws.grafana.WorkspaceDataSource(`${environment}-prometheus-datasource`, {
        workspaceId: grafanaWorkspace.id,
        name: "Prometheus",
        type: "prometheus",
        configuration: JSON.stringify({
            url: pulumi.interpolate`https://aps-workspaces.${aws.config.region}.amazonaws.com/workspaces/${prometheusWorkspaceId}`,
            access: "proxy",
            isDefault: true,
            jsonData: {
                httpMethod: "POST",
                sigV4Auth: true,
                sigV4AuthType: "workspace",
                sigV4Region: aws.config.region || "us-east-1",
            },
        }),
    });
    
    return {
        workspaceId: grafanaWorkspace.id,
        endpoint: grafanaWorkspace.endpoint,
    };
}

/**
 * Loads and processes a dashboard template file
 * 
 * @param templatePath Path to the dashboard template file
 * @param replacements Placeholder replacements for the template
 * @returns Processed dashboard JSON
 */
function loadDashboardTemplate(
    templatePath: string,
    replacements: Record<string, string>
): string {
    try {
        // Read the template file
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        
        // Replace placeholders with actual values
        let processedContent = templateContent;
        for (const [key, value] of Object.entries(replacements)) {
            processedContent = processedContent.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
        }
        
        // Validate the JSON
        JSON.parse(processedContent);
        
        return processedContent;
    } catch (error) {
        throw new Error(`Error loading dashboard template: ${error}`);
    }
}

/**
 * Creates environment-specific alarm thresholds
 * 
 * @param environment Deployment environment name
 * @returns Map of alarm thresholds by metric name
 */
function createAlarmThresholds(environment: string): Record<string, AlarmThreshold> {
    // Define base thresholds that apply to all environments
    const baseThresholds: Record<string, AlarmThreshold> = {
        ecsBackendCpu: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        ecsWebCpu: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        ecsBackendMemory: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        ecsWebMemory: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        rdsCpu: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        rdsConnections: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        rdsStorage: {
            warning: 20480, // 20GB
            critical: 10240, // 10GB
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        redisCpu: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        redisMemory: {
            warning: 70,
            critical: 85,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        apiLatency: {
            warning: 300, // 300ms
            critical: 500, // 500ms
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        api5xxErrors: {
            warning: 5,
            critical: 10,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
        s3BucketSize: {
            warning: 5368709120, // 5GB
            critical: 10737418240, // 10GB
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
        },
        cdnErrorRate: {
            warning: 1,
            critical: 5,
            evaluationPeriods: 3,
            datapointsToAlarm: 3,
        },
    };
    
    // Adjust thresholds based on environment
    if (environment === 'prod') {
        return {
            ...baseThresholds,
            // Stricter thresholds for production
            ecsBackendCpu: {
                warning: 60,
                critical: 80,
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
            },
            ecsWebCpu: {
                warning: 60,
                critical: 80,
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
            },
            rdsCpu: {
                warning: 60,
                critical: 80,
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
            },
            apiLatency: {
                warning: 200, // 200ms
                critical: 300, // 300ms
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
            },
            api5xxErrors: {
                warning: 2,
                critical: 5,
                evaluationPeriods: 2,
                datapointsToAlarm: 2,
            },
        };
    } else if (environment === 'staging') {
        return {
            ...baseThresholds,
            // Moderate thresholds for staging
            apiLatency: {
                warning: 400, // 400ms
                critical: 600, // 600ms
                evaluationPeriods: 3,
                datapointsToAlarm: 2,
            },
        };
    } else {
        // Default thresholds for dev environment
        return baseThresholds; 
    }
}