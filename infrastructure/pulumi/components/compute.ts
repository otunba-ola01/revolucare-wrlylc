import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import { Config } from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import { NetworkOutputs } from './networking';
import { DatabaseOutputs } from './database';
import { StorageOutputs } from './storage';

/**
 * Interface defining the structure of compute infrastructure outputs
 */
export interface ComputeOutputs {
    /**
     * ARN of the created ECS cluster
     */
    ecsClusterArn: string;
    
    /**
     * DNS name of the Application Load Balancer
     */
    loadBalancerDnsName: string;
    
    /**
     * ARN of the Application Load Balancer
     */
    loadBalancerArn: string;
    
    /**
     * Map of ECS service ARNs by service name
     */
    serviceArns: Record<string, string>;
    
    /**
     * Map of target group ARNs by service name
     */
    targetGroupArns: Record<string, string>;
}

/**
 * Interface defining the options for compute infrastructure creation
 */
export interface ComputeOptions {
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
     * Outputs from the storage infrastructure creation
     */
    storageOutputs: StorageOutputs;
    
    /**
     * Map of container image URIs by service name
     */
    containerImages: Record<string, string>;
    
    /**
     * CPU units for ECS tasks
     */
    ecsTaskCpu: number;
    
    /**
     * Memory for ECS tasks in MB
     */
    ecsTaskMemory: number;
    
    /**
     * ARN of the SSL certificate for HTTPS
     */
    certificateArn: string;
    
    /**
     * ARN of the ECS task execution role
     */
    executionRoleArn: string;
    
    /**
     * ARN of the ECS task role
     */
    taskRoleArn: string;
    
    /**
     * SNS topic for CloudWatch alarms
     */
    alertTopic: aws.sns.Topic;
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for container definition
 */
interface ContainerDefinition {
    name: string;
    image: string;
    cpu: number;
    memory: number;
    essential: boolean;
    portMappings: PortMapping[];
    environment: KeyValuePair[];
    secrets: Secret[];
    logConfiguration: LogConfiguration;
    healthCheck: HealthCheck;
}

/**
 * Interface for port mapping configuration
 */
interface PortMapping {
    containerPort: number;
    hostPort: number;
    protocol: string;
}

/**
 * Interface for key-value pairs (environment variables)
 */
interface KeyValuePair {
    name: string;
    value: string;
}

/**
 * Interface for container secrets
 */
interface Secret {
    name: string;
    valueFrom: string;
}

/**
 * Interface for container log configuration
 */
interface LogConfiguration {
    logDriver: string;
    options: Record<string, string>;
}

/**
 * Interface for container health check configuration
 */
interface HealthCheck {
    command: string[];
    interval: number;
    timeout: number;
    retries: number;
    startPeriod: number;
}

/**
 * Interface for auto-scaling configuration
 */
export interface AutoScalingConfiguration {
    minCapacity: number;
    maxCapacity: number;
    cpuThreshold: number;
    memoryThreshold: number;
    requestCountThreshold: number;
    scaleOutCooldown: number;
    scaleInCooldown: number;
}

/**
 * Creates and configures all compute infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the compute infrastructure
 * @returns ComputeOutputs containing references to created compute resources
 */
export function createComputeInfrastructure(options: ComputeOptions): ComputeOutputs {
    const {
        environment,
        networkOutputs,
        databaseOutputs,
        storageOutputs,
        containerImages,
        ecsTaskCpu,
        ecsTaskMemory,
        certificateArn,
        executionRoleArn,
        taskRoleArn,
        alertTopic,
        tags,
    } = options;
    
    // Get environment-specific configurations
    const config = new Config();
    const serviceTags = {
        ...tags,
        Environment: environment,
        Application: 'Revolucare',
    };

    // Create ECS cluster with Fargate
    const ecsCluster = createEcsCluster(environment, serviceTags);
    
    // Create Application Load Balancer
    const loadBalancer = createLoadBalancer(
        environment, 
        networkOutputs.vpcId, 
        networkOutputs.publicSubnetIds, 
        networkOutputs.securityGroupIds.alb,
        serviceTags
    );
    
    // Create target groups for services
    const targetGroups = createTargetGroups(
        environment,
        networkOutputs.vpcId,
        serviceTags
    );
    
    // Create listeners for HTTP/HTTPS
    const listeners = createListeners(
        environment,
        loadBalancer,
        targetGroups,
        certificateArn,
        serviceTags
    );
    
    // Create task definitions for services
    const taskDefinitions = createTaskDefinitions(
        environment,
        containerImages,
        ecsTaskCpu,
        ecsTaskMemory,
        executionRoleArn,
        taskRoleArn,
        databaseOutputs,
        storageOutputs,
        serviceTags
    );
    
    // Create service discovery namespace and services
    const serviceDiscovery = createServiceDiscovery(
        environment,
        serviceTags
    );
    
    // Create ECS services
    const ecsServices = createEcsServices(
        environment,
        ecsCluster,
        taskDefinitions,
        targetGroups,
        networkOutputs.privateSubnetIds,
        networkOutputs.securityGroupIds,
        serviceTags
    );
    
    // Create auto-scaling policies
    const autoScalingPolicies = createAutoScalingPolicies(
        environment,
        ecsCluster.name,
        ecsServices,
        serviceTags
    );
    
    // Create CloudWatch alarms
    const alarms = createCloudWatchAlarms(
        environment,
        ecsCluster.name,
        ecsServices,
        alertTopic,
        serviceTags
    );
    
    // Return compute infrastructure outputs
    return {
        ecsClusterArn: ecsCluster.arn,
        loadBalancerDnsName: loadBalancer.dnsName,
        loadBalancerArn: loadBalancer.arn,
        serviceArns: {
            backend: ecsServices.backend.id,
            web: ecsServices.web.id,
        },
        targetGroupArns: {
            backend: targetGroups.backend.arn,
            web: targetGroups.web.arn,
        },
    };
}

/**
 * Creates an ECS cluster with Fargate capacity providers
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Created ECS cluster
 */
function createEcsCluster(
    environment: string,
    tags: Record<string, string>
): aws.ecs.Cluster {
    const cluster = new aws.ecs.Cluster(`${environment}-cluster`, {
        capacityProviders: ["FARGATE", "FARGATE_SPOT"],
        defaultCapacityProviderStrategies: [
            {
                capacityProvider: environment === "prod" ? "FARGATE" : "FARGATE_SPOT",
                weight: 1,
                base: 1,
            },
        ],
        settings: [
            {
                name: "containerInsights",
                value: environment === "dev" ? "disabled" : "enabled",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-cluster`,
        },
    });
    
    return cluster;
}

/**
 * Creates an Application Load Balancer for routing traffic to ECS services
 * 
 * @param environment Deployment environment name
 * @param vpcId ID of the VPC
 * @param publicSubnetIds IDs of public subnets for the ALB
 * @param securityGroupId Security group ID for the ALB
 * @param tags Resource tags to apply
 * @returns Created Application Load Balancer
 */
function createLoadBalancer(
    environment: string,
    vpcId: string,
    publicSubnetIds: string[],
    securityGroupId: string,
    tags: Record<string, string>
): aws.lb.LoadBalancer {
    const loadBalancer = new aws.lb.LoadBalancer(`${environment}-alb`, {
        internal: false,
        loadBalancerType: "application",
        securityGroups: [securityGroupId],
        subnets: publicSubnetIds,
        enableDeletionProtection: environment === "prod",
        enableHttp2: true,
        idleTimeout: 60,
        accessLogs: environment !== "dev" ? {
            bucket: `revolucare-${environment}-logs`,
            prefix: "alb",
            enabled: true,
        } : undefined,
        tags: {
            ...tags,
            Name: `${environment}-alb`,
        },
    });
    
    return loadBalancer;
}

/**
 * Creates target groups for routing traffic to ECS services
 * 
 * @param environment Deployment environment name
 * @param vpcId ID of the VPC
 * @param tags Resource tags to apply
 * @returns Map of created target groups by service name
 */
function createTargetGroups(
    environment: string,
    vpcId: string,
    tags: Record<string, string>
): Record<string, aws.lb.TargetGroup> {
    // Backend API target group
    const backendTargetGroup = new aws.lb.TargetGroup(`${environment}-backend-tg`, {
        port: 80,
        protocol: "HTTP",
        vpcId: vpcId,
        targetType: "ip",
        deregistrationDelay: 30, // 30 seconds
        slowStart: 30, // 30 seconds
        healthCheck: {
            enabled: true,
            path: "/api/health",
            port: "traffic-port",
            protocol: "HTTP",
            healthyThreshold: 3,
            unhealthyThreshold: 3,
            timeout: 5,
            interval: 30,
            matcher: "200-299",
        },
        tags: {
            ...tags,
            Name: `${environment}-backend-tg`,
            Service: "backend",
        },
    });
    
    // Web frontend target group
    const webTargetGroup = new aws.lb.TargetGroup(`${environment}-web-tg`, {
        port: 80,
        protocol: "HTTP",
        vpcId: vpcId,
        targetType: "ip",
        deregistrationDelay: 30, // 30 seconds
        slowStart: 30, // 30 seconds
        healthCheck: {
            enabled: true,
            path: "/",
            port: "traffic-port",
            protocol: "HTTP",
            healthyThreshold: 3,
            unhealthyThreshold: 3,
            timeout: 5,
            interval: 30,
            matcher: "200-299",
        },
        tags: {
            ...tags,
            Name: `${environment}-web-tg`,
            Service: "web",
        },
    });
    
    return {
        backend: backendTargetGroup,
        web: webTargetGroup,
    };
}

/**
 * Creates load balancer listeners for HTTP and HTTPS traffic
 * 
 * @param environment Deployment environment name
 * @param loadBalancer Load balancer to create listeners for
 * @param targetGroups Target groups for routing traffic
 * @param certificateArn ARN of the SSL certificate
 * @param tags Resource tags to apply
 * @returns Map of created listeners by protocol
 */
function createListeners(
    environment: string,
    loadBalancer: aws.lb.LoadBalancer,
    targetGroups: Record<string, aws.lb.TargetGroup>,
    certificateArn: string,
    tags: Record<string, string>
): Record<string, aws.lb.Listener> {
    // HTTP listener that redirects to HTTPS
    const httpListener = new aws.lb.Listener(`${environment}-http-listener`, {
        loadBalancerArn: loadBalancer.arn,
        port: 80,
        protocol: "HTTP",
        defaultActions: [{
            type: "redirect",
            redirect: {
                port: "443",
                protocol: "HTTPS",
                statusCode: "HTTP_301",
            },
        }],
        tags: {
            ...tags,
            Name: `${environment}-http-listener`,
            Protocol: "HTTP",
        },
    });
    
    // HTTPS listener with path-based routing
    const httpsListener = new aws.lb.Listener(`${environment}-https-listener`, {
        loadBalancerArn: loadBalancer.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
        certificateArn: certificateArn,
        defaultActions: [{
            type: "forward",
            targetGroupArn: targetGroups.web.arn,
        }],
        tags: {
            ...tags,
            Name: `${environment}-https-listener`,
            Protocol: "HTTPS",
        },
    });
    
    // Create API path-based routing rule
    const apiListenerRule = new aws.lb.ListenerRule(`${environment}-api-rule`, {
        listenerArn: httpsListener.arn,
        priority: 10,
        actions: [{
            type: "forward",
            targetGroupArn: targetGroups.backend.arn,
        }],
        conditions: [{
            pathPattern: {
                values: ["/api/*"],
            },
        }],
        tags: {
            ...tags,
            Name: `${environment}-api-rule`,
            Service: "API",
        },
    });
    
    return {
        http: httpListener,
        https: httpsListener,
    };
}

/**
 * Creates ECS task definitions for application services
 * 
 * @param environment Deployment environment name
 * @param containerImages Map of container image URIs by service name
 * @param taskCpu CPU units for task definitions
 * @param taskMemory Memory for task definitions in MB
 * @param executionRoleArn ARN of the ECS task execution role
 * @param taskRoleArn ARN of the ECS task role
 * @param databaseOutputs Database infrastructure outputs
 * @param storageOutputs Storage infrastructure outputs
 * @param tags Resource tags to apply
 * @returns Map of created task definitions by service name
 */
function createTaskDefinitions(
    environment: string,
    containerImages: Record<string, string>,
    taskCpu: number,
    taskMemory: number,
    executionRoleArn: string,
    taskRoleArn: string,
    databaseOutputs: DatabaseOutputs,
    storageOutputs: StorageOutputs,
    tags: Record<string, string>
): Record<string, aws.ecs.TaskDefinition> {
    // Common environment variables for all services
    const commonEnv = [
        { name: "NODE_ENV", value: environment === "prod" ? "production" : environment },
        { name: "DATABASE_HOST", value: databaseOutputs.rdsEndpoint },
        { name: "DATABASE_PORT", value: databaseOutputs.rdsPort.toString() },
        { name: "REDIS_HOST", value: databaseOutputs.redisEndpoint },
        { name: "REDIS_PORT", value: databaseOutputs.redisPort.toString() },
        { name: "DOCUMENT_BUCKET", value: storageOutputs.documentBucketName },
        { name: "ASSETS_BUCKET", value: storageOutputs.assetsBucketName },
        { name: "ENVIRONMENT", value: environment },
    ];
    
    // Common secrets from Parameter Store
    const commonSecrets = [
        { name: "DATABASE_PASSWORD", valueFrom: `/${environment}/revolucare/db-password` },
        { name: "JWT_SECRET", valueFrom: `/${environment}/revolucare/jwt-secret` },
        { name: "OPENAI_API_KEY", valueFrom: `/${environment}/revolucare/openai-api-key` },
    ];
    
    // Backend task definition
    const backendTaskDef = new aws.ecs.TaskDefinition(`${environment}-backend-task`, {
        family: `${environment}-revolucare-backend`,
        cpu: taskCpu.toString(),
        memory: taskMemory.toString(),
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        executionRoleArn: executionRoleArn,
        taskRoleArn: taskRoleArn,
        containerDefinitions: JSON.stringify([
            {
                name: "backend",
                image: containerImages.backend,
                essential: true,
                cpu: taskCpu,
                memory: taskMemory,
                portMappings: [
                    {
                        containerPort: 3000,
                        hostPort: 3000,
                        protocol: "tcp",
                    },
                ],
                environment: [
                    ...commonEnv,
                    { name: "PORT", value: "3000" },
                    { name: "SERVICE_NAME", value: "backend" },
                ],
                secrets: commonSecrets,
                logConfiguration: {
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": `/ecs/${environment}/revolucare-backend`,
                        "awslogs-region": aws.config.region || "us-east-1",
                        "awslogs-stream-prefix": "backend",
                        "awslogs-create-group": "true",
                    },
                },
                healthCheck: {
                    command: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
                    interval: 30,
                    timeout: 5,
                    retries: 3,
                    startPeriod: 60,
                },
            },
        ]),
        tags: {
            ...tags,
            Name: `${environment}-backend-task`,
            Service: "backend",
        },
    });
    
    // Web frontend task definition
    const webTaskDef = new aws.ecs.TaskDefinition(`${environment}-web-task`, {
        family: `${environment}-revolucare-web`,
        cpu: taskCpu.toString(),
        memory: taskMemory.toString(),
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        executionRoleArn: executionRoleArn,
        taskRoleArn: taskRoleArn,
        containerDefinitions: JSON.stringify([
            {
                name: "web",
                image: containerImages.web,
                essential: true,
                cpu: taskCpu,
                memory: taskMemory,
                portMappings: [
                    {
                        containerPort: 3000,
                        hostPort: 3000,
                        protocol: "tcp",
                    },
                ],
                environment: [
                    ...commonEnv,
                    { name: "PORT", value: "3000" },
                    { name: "SERVICE_NAME", value: "web" },
                    { name: "BACKEND_URL", value: `https://api.revolucare-${environment}.com` },
                ],
                secrets: commonSecrets,
                logConfiguration: {
                    logDriver: "awslogs",
                    options: {
                        "awslogs-group": `/ecs/${environment}/revolucare-web`,
                        "awslogs-region": aws.config.region || "us-east-1",
                        "awslogs-stream-prefix": "web",
                        "awslogs-create-group": "true",
                    },
                },
                healthCheck: {
                    command: ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
                    interval: 30,
                    timeout: 5,
                    retries: 3,
                    startPeriod: 60,
                },
            },
        ]),
        tags: {
            ...tags,
            Name: `${environment}-web-task`,
            Service: "web",
        },
    });
    
    return {
        backend: backendTaskDef,
        web: webTaskDef,
    };
}

/**
 * Creates ECS services for running application containers
 * 
 * @param environment Deployment environment name
 * @param cluster ECS cluster for the services
 * @param taskDefinitions Task definitions for the services
 * @param targetGroups Target groups for load balancing
 * @param privateSubnetIds IDs of private subnets for the services
 * @param securityGroupIds Security group IDs for the services
 * @param tags Resource tags to apply
 * @returns Map of created ECS services by service name
 */
function createEcsServices(
    environment: string,
    cluster: aws.ecs.Cluster,
    taskDefinitions: Record<string, aws.ecs.TaskDefinition>,
    targetGroups: Record<string, aws.lb.TargetGroup>,
    privateSubnetIds: string[],
    securityGroupIds: Record<string, string>,
    tags: Record<string, string>
): Record<string, aws.ecs.Service> {
    // Service scaling configuration based on environment
    const serviceConfig = {
        dev: {
            backend: { desiredCount: 1, minCapacity: 1, maxCapacity: 2 },
            web: { desiredCount: 1, minCapacity: 1, maxCapacity: 2 },
        },
        staging: {
            backend: { desiredCount: 2, minCapacity: 2, maxCapacity: 4 },
            web: { desiredCount: 2, minCapacity: 2, maxCapacity: 4 },
        },
        prod: {
            backend: { desiredCount: 3, minCapacity: 3, maxCapacity: 10 },
            web: { desiredCount: 3, minCapacity: 3, maxCapacity: 10 },
        },
    };
    
    // Get configuration for current environment
    const config = (serviceConfig as any)[environment] || serviceConfig.dev;
    
    // Backend service
    const backendService = new aws.ecs.Service(`${environment}-backend-service`, {
        cluster: cluster.id,
        taskDefinition: taskDefinitions.backend.arn,
        desiredCount: config.backend.desiredCount,
        launchType: "FARGATE",
        platformVersion: "LATEST",
        deploymentController: {
            type: "ECS",
        },
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        deploymentCircuitBreaker: {
            enable: true,
            rollback: true,
        },
        propagateTags: "SERVICE",
        enableExecuteCommand: environment !== "prod",
        networkConfiguration: {
            subnets: privateSubnetIds,
            securityGroups: [securityGroupIds.app],
            assignPublicIp: false,
        },
        loadBalancers: [
            {
                targetGroupArn: targetGroups.backend.arn,
                containerName: "backend",
                containerPort: 3000,
            },
        ],
        healthCheckGracePeriodSeconds: 60,
        capacityProviderStrategies: [
            {
                capacityProvider: environment === "prod" ? "FARGATE" : "FARGATE_SPOT",
                weight: 1,
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-backend-service`,
            Service: "backend",
        },
    });
    
    // Web frontend service
    const webService = new aws.ecs.Service(`${environment}-web-service`, {
        cluster: cluster.id,
        taskDefinition: taskDefinitions.web.arn,
        desiredCount: config.web.desiredCount,
        launchType: "FARGATE",
        platformVersion: "LATEST",
        deploymentController: {
            type: "ECS",
        },
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        deploymentCircuitBreaker: {
            enable: true,
            rollback: true,
        },
        propagateTags: "SERVICE",
        enableExecuteCommand: environment !== "prod",
        networkConfiguration: {
            subnets: privateSubnetIds,
            securityGroups: [securityGroupIds.app],
            assignPublicIp: false,
        },
        loadBalancers: [
            {
                targetGroupArn: targetGroups.web.arn,
                containerName: "web",
                containerPort: 3000,
            },
        ],
        healthCheckGracePeriodSeconds: 60,
        capacityProviderStrategies: [
            {
                capacityProvider: environment === "prod" ? "FARGATE" : "FARGATE_SPOT",
                weight: 1,
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-web-service`,
            Service: "web",
        },
    });
    
    return {
        backend: backendService,
        web: webService,
    };
}

/**
 * Creates auto-scaling policies for ECS services
 * 
 * @param environment Deployment environment name
 * @param clusterName Name of the ECS cluster
 * @param services Map of ECS services by service name
 * @param tags Resource tags to apply
 * @returns Map of created auto-scaling policies by service name
 */
function createAutoScalingPolicies(
    environment: string,
    clusterName: string,
    services: Record<string, aws.ecs.Service>,
    tags: Record<string, string>
): Record<string, Record<string, aws.appautoscaling.Policy>> {
    // Service scaling configuration based on environment
    const serviceConfig = {
        dev: {
            backend: { minCapacity: 1, maxCapacity: 2, cpuThreshold: 70, memoryThreshold: 70, requestCountThreshold: 500 },
            web: { minCapacity: 1, maxCapacity: 2, cpuThreshold: 70, memoryThreshold: 70, requestCountThreshold: 1000 },
        },
        staging: {
            backend: { minCapacity: 2, maxCapacity: 4, cpuThreshold: 60, memoryThreshold: 60, requestCountThreshold: 1000 },
            web: { minCapacity: 2, maxCapacity: 4, cpuThreshold: 60, memoryThreshold: 60, requestCountThreshold: 2000 },
        },
        prod: {
            backend: { minCapacity: 3, maxCapacity: 10, cpuThreshold: 50, memoryThreshold: 50, requestCountThreshold: 2000 },
            web: { minCapacity: 3, maxCapacity: 10, cpuThreshold: 50, memoryThreshold: 50, requestCountThreshold: 5000 },
        },
    };
    
    // Get configuration for current environment
    const config = (serviceConfig as any)[environment] || serviceConfig.dev;
    
    const policies: Record<string, Record<string, aws.appautoscaling.Policy>> = {
        backend: {},
        web: {},
    };
    
    // Create scaling targets and policies for each service
    for (const [serviceName, service] of Object.entries(services)) {
        const serviceConfig = (config as any)[serviceName];
        
        // Create scaling target
        const scalableTarget = new aws.appautoscaling.Target(`${environment}-${serviceName}-target`, {
            serviceNamespace: "ecs",
            resourceId: pulumi.interpolate`service/${clusterName}/${service.name}`,
            scalableDimension: "ecs:service:DesiredCount",
            minCapacity: serviceConfig.minCapacity,
            maxCapacity: serviceConfig.maxCapacity,
        });
        
        // CPU utilization scaling policy
        policies[serviceName] = policies[serviceName] || {};
        policies[serviceName].cpu = new aws.appautoscaling.Policy(`${environment}-${serviceName}-cpu-policy`, {
            policyType: "TargetTrackingScaling",
            resourceId: scalableTarget.resourceId,
            scalableDimension: scalableTarget.scalableDimension,
            serviceNamespace: scalableTarget.serviceNamespace,
            targetTrackingScalingPolicyConfiguration: {
                predefinedMetricSpecification: {
                    predefinedMetricType: "ECSServiceAverageCPUUtilization",
                },
                targetValue: serviceConfig.cpuThreshold,
                scaleInCooldown: 300, // 5 minutes
                scaleOutCooldown: 60, // 1 minute
            },
        });
        
        // Memory utilization scaling policy
        policies[serviceName].memory = new aws.appautoscaling.Policy(`${environment}-${serviceName}-memory-policy`, {
            policyType: "TargetTrackingScaling",
            resourceId: scalableTarget.resourceId,
            scalableDimension: scalableTarget.scalableDimension,
            serviceNamespace: scalableTarget.serviceNamespace,
            targetTrackingScalingPolicyConfiguration: {
                predefinedMetricSpecification: {
                    predefinedMetricType: "ECSServiceAverageMemoryUtilization",
                },
                targetValue: serviceConfig.memoryThreshold,
                scaleInCooldown: 300, // 5 minutes
                scaleOutCooldown: 60, // 1 minute
            },
        });
        
        // Request count scaling policy (ALB request count per target)
        policies[serviceName].requestCount = new aws.appautoscaling.Policy(`${environment}-${serviceName}-request-policy`, {
            policyType: "TargetTrackingScaling",
            resourceId: scalableTarget.resourceId,
            scalableDimension: scalableTarget.scalableDimension,
            serviceNamespace: scalableTarget.serviceNamespace,
            targetTrackingScalingPolicyConfiguration: {
                predefinedMetricSpecification: {
                    predefinedMetricType: "ALBRequestCountPerTarget",
                    resourceLabel: pulumi.interpolate`${service.loadBalancers[0].targetGroupArn.apply(arn => {
                        const parts = arn.split(":");
                        const lbName = parts[5].split("/")[1];
                        const tgName = parts[5].split("/")[2];
                        return `app/${lbName}/${tgName}`;
                    })}`,
                },
                targetValue: serviceConfig.requestCountThreshold,
                scaleInCooldown: 300, // 5 minutes
                scaleOutCooldown: 60, // 1 minute
            },
        });
    }
    
    return policies;
}

/**
 * Creates service discovery resources for inter-service communication
 * 
 * @param environment Deployment environment name
 * @param tags Resource tags to apply
 * @returns Service discovery namespace and services
 */
function createServiceDiscovery(
    environment: string,
    tags: Record<string, string>
): { namespace: aws.servicediscovery.PrivateDnsNamespace, services: Record<string, aws.servicediscovery.Service> } {
    // Create private DNS namespace for service discovery
    const namespace = new aws.servicediscovery.PrivateDnsNamespace(`${environment}-namespace`, {
        name: `${environment}.revolucare.local`,
        description: `Service discovery namespace for Revolucare ${environment} environment`,
        vpc: pulumi.output(aws.ec2.getVpc({ tags: { Environment: environment } })).id,
        tags: {
            ...tags,
            Name: `${environment}-namespace`,
        },
    });
    
    // Create service discovery service for backend
    const backendService = new aws.servicediscovery.Service(`${environment}-backend-discovery`, {
        name: "backend",
        dnsConfig: {
            namespaceId: namespace.id,
            dnsRecords: [{
                ttl: 10,
                type: "A",
            }],
            routingPolicy: "MULTIVALUE",
        },
        healthCheckCustomConfig: {
            failureThreshold: 1,
        },
        tags: {
            ...tags,
            Name: `${environment}-backend-discovery`,
            Service: "backend",
        },
    });
    
    // Create service discovery service for web
    const webService = new aws.servicediscovery.Service(`${environment}-web-discovery`, {
        name: "web",
        dnsConfig: {
            namespaceId: namespace.id,
            dnsRecords: [{
                ttl: 10,
                type: "A",
            }],
            routingPolicy: "MULTIVALUE",
        },
        healthCheckCustomConfig: {
            failureThreshold: 1,
        },
        tags: {
            ...tags,
            Name: `${environment}-web-discovery`,
            Service: "web",
        },
    });
    
    return {
        namespace,
        services: {
            backend: backendService,
            web: webService,
        },
    };
}

/**
 * Creates CloudWatch alarms for ECS services
 * 
 * @param environment Deployment environment name
 * @param clusterName Name of the ECS cluster
 * @param services Map of ECS services by service name
 * @param alertTopic SNS topic for alarm notifications
 * @param tags Resource tags to apply
 * @returns Map of created CloudWatch alarms
 */
function createCloudWatchAlarms(
    environment: string,
    clusterName: string,
    services: Record<string, aws.ecs.Service>,
    alertTopic: aws.sns.Topic,
    tags: Record<string, string>
): Record<string, aws.cloudwatch.MetricAlarm> {
    const alarms: Record<string, aws.cloudwatch.MetricAlarm> = {};
    
    // Create alarms for each service
    for (const [serviceName, service] of Object.entries(services)) {
        // CPU utilization alarm
        alarms[`${serviceName}-cpu`] = new aws.cloudwatch.MetricAlarm(`${environment}-${serviceName}-cpu-alarm`, {
            alarmDescription: `${environment} ${serviceName} service CPU utilization`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "CPUUtilization",
            namespace: "AWS/ECS",
            period: 300, // 5 minutes
            statistic: "Average",
            threshold: environment === "prod" ? 80 : 90,
            alarmActions: [alertTopic.arn],
            okActions: [alertTopic.arn],
            dimensions: {
                ClusterName: clusterName,
                ServiceName: service.name,
            },
            tags: {
                ...tags,
                Name: `${environment}-${serviceName}-cpu-alarm`,
                Service: serviceName,
            },
        });
        
        // Memory utilization alarm
        alarms[`${serviceName}-memory`] = new aws.cloudwatch.MetricAlarm(`${environment}-${serviceName}-memory-alarm`, {
            alarmDescription: `${environment} ${serviceName} service memory utilization`,
            comparisonOperator: "GreaterThanThreshold",
            evaluationPeriods: 2,
            metricName: "MemoryUtilization",
            namespace: "AWS/ECS",
            period: 300, // 5 minutes
            statistic: "Average",
            threshold: environment === "prod" ? 80 : 90,
            alarmActions: [alertTopic.arn],
            okActions: [alertTopic.arn],
            dimensions: {
                ClusterName: clusterName,
                ServiceName: service.name,
            },
            tags: {
                ...tags,
                Name: `${environment}-${serviceName}-memory-alarm`,
                Service: serviceName,
            },
        });
        
        // Service health (running tasks) alarm
        alarms[`${serviceName}-tasks`] = new aws.cloudwatch.MetricAlarm(`${environment}-${serviceName}-tasks-alarm`, {
            alarmDescription: `${environment} ${serviceName} service running tasks`,
            comparisonOperator: "LessThanThreshold",
            evaluationPeriods: 2,
            metricName: "RunningTaskCount",
            namespace: "ECS/ContainerInsights",
            period: 300, // 5 minutes
            statistic: "Average",
            threshold: environment === "prod" ? 2 : 1,
            alarmActions: [alertTopic.arn],
            okActions: [alertTopic.arn],
            dimensions: {
                ClusterName: clusterName,
                ServiceName: service.name,
            },
            tags: {
                ...tags,
                Name: `${environment}-${serviceName}-tasks-alarm`,
                Service: serviceName,
            },
        });
    }
    
    // Add load balancer alarms
    alarms["alb-5xx"] = new aws.cloudwatch.MetricAlarm(`${environment}-alb-5xx-alarm`, {
        alarmDescription: `${environment} ALB 5XX error count`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "HTTPCode_ELB_5XX_Count",
        namespace: "AWS/ApplicationELB",
        period: 300, // 5 minutes
        statistic: "Sum",
        threshold: environment === "prod" ? 10 : 20,
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        dimensions: {
            LoadBalancer: pulumi.interpolate`app/${environment}-alb`,
        },
        tags: {
            ...tags,
            Name: `${environment}-alb-5xx-alarm`,
            Component: "LoadBalancer",
        },
    });
    
    // ALB target response time alarm
    alarms["alb-latency"] = new aws.cloudwatch.MetricAlarm(`${environment}-alb-latency-alarm`, {
        alarmDescription: `${environment} ALB target response time`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "TargetResponseTime",
        namespace: "AWS/ApplicationELB",
        period: 300, // 5 minutes
        statistic: "Average",
        threshold: environment === "prod" ? 0.5 : 1.0, // 500ms for prod, 1s for others
        alarmActions: [alertTopic.arn],
        okActions: [alertTopic.arn],
        dimensions: {
            LoadBalancer: pulumi.interpolate`app/${environment}-alb`,
        },
        tags: {
            ...tags,
            Name: `${environment}-alb-latency-alarm`,
            Component: "LoadBalancer",
        },
    });
    
    return alarms;
}