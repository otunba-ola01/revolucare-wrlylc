import * as pulumi from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0
import * as aws from '@pulumi/aws'; // @pulumi/aws ^5.0.0
import { Config } from '@pulumi/pulumi'; // @pulumi/pulumi ^3.0.0

/**
 * Interface for network infrastructure creation options
 */
export interface NetworkOptions {
    /**
     * Deployment environment (dev, staging, prod)
     */
    environment: string;
    
    /**
     * CIDR block for the VPC (e.g., '10.0.0.0/16')
     */
    vpcCidr: string;
    
    /**
     * CIDR blocks for public subnets
     */
    publicSubnetCidrs: string[];
    
    /**
     * CIDR blocks for private subnets
     */
    privateSubnetCidrs: string[];
    
    /**
     * Number of availability zones to use
     */
    availabilityZones: number;
    
    /**
     * Resource tags to apply to all created resources
     */
    tags: Record<string, string>;
}

/**
 * Interface for network infrastructure outputs
 */
export interface NetworkOutputs {
    /**
     * ID of the created VPC
     */
    vpcId: string;
    
    /**
     * IDs of the created public subnets
     */
    publicSubnetIds: string[];
    
    /**
     * IDs of the created private subnets
     */
    privateSubnetIds: string[];
    
    /**
     * Map of security group IDs by name
     */
    securityGroupIds: Record<string, string>;
    
    /**
     * IDs of the created NAT Gateways
     */
    natGatewayIds: string[];
    
    /**
     * Map of route table IDs by type (public, private)
     */
    routeTableIds: Record<string, string[]>;
    
    /**
     * CIDR block of the created VPC
     */
    vpcCidr: string;
    
    /**
     * ID of the created VPC Flow Log
     */
    flowLogId: string;
}

/**
 * Interface for organizing subnet resources by type
 */
interface SubnetResources {
    /**
     * Array of created public subnet resources
     */
    public: aws.ec2.Subnet[];
    
    /**
     * Array of created private subnet resources
     */
    private: aws.ec2.Subnet[];
}

/**
 * Interface for organizing route table resources by type
 */
interface RouteTableResources {
    /**
     * Public route table resource
     */
    public: aws.ec2.RouteTable;
    
    /**
     * Array of private route table resources
     */
    private: aws.ec2.RouteTable[];
}

/**
 * Interface for organizing network ACL resources by type
 */
interface NetworkAclResources {
    /**
     * Public Network ACL resource
     */
    public: aws.ec2.NetworkAcl;
    
    /**
     * Private Network ACL resource
     */
    private: aws.ec2.NetworkAcl;
}

/**
 * Creates a Virtual Private Cloud (VPC) with appropriate CIDR block and settings
 * 
 * @param environment Deployment environment name
 * @param cidrBlock CIDR block for the VPC
 * @param tags Resource tags to apply
 * @returns Created VPC resource
 */
function createVpc(
    environment: string,
    cidrBlock: string,
    tags: Record<string, string>
): aws.ec2.Vpc {
    const vpc = new aws.ec2.Vpc(`${environment}-vpc`, {
        cidrBlock,
        enableDnsSupport: true,
        enableDnsHostnames: true,
        tags: {
            ...tags,
            Name: `${environment}-vpc`,
        },
    });
    
    return vpc;
}

/**
 * Creates an Internet Gateway and attaches it to the VPC
 * 
 * @param environment Deployment environment name
 * @param vpc VPC to attach the gateway to
 * @param tags Resource tags to apply
 * @returns Created Internet Gateway resource
 */
function createInternetGateway(
    environment: string,
    vpc: aws.ec2.Vpc,
    tags: Record<string, string>
): aws.ec2.InternetGateway {
    const igw = new aws.ec2.InternetGateway(`${environment}-igw`, {
        vpcId: vpc.id,
        tags: {
            ...tags,
            Name: `${environment}-igw`,
        },
    });
    
    return igw;
}

/**
 * Creates public and private subnets across multiple availability zones
 * 
 * @param environment Deployment environment name
 * @param vpc VPC where subnets will be created
 * @param publicCidrs CIDR blocks for public subnets
 * @param privateCidrs CIDR blocks for private subnets
 * @param tags Resource tags to apply
 * @returns Created subnet resources grouped by type
 */
function createSubnets(
    environment: string,
    vpc: aws.ec2.Vpc,
    publicCidrs: string[],
    privateCidrs: string[],
    tags: Record<string, string>
): SubnetResources {
    // Get available availability zones
    const getAzs = aws.getAvailabilityZones({
        state: "available",
    });
    
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];
    
    // Create public subnets
    for (let i = 0; i < publicCidrs.length; i++) {
        const subnet = new aws.ec2.Subnet(`${environment}-public-subnet-${i + 1}`, {
            vpcId: vpc.id,
            cidrBlock: publicCidrs[i],
            availabilityZone: getAzs.then(azs => azs.names[i % azs.names.length]),
            mapPublicIpOnLaunch: true,
            tags: {
                ...tags,
                Name: `${environment}-public-subnet-${i + 1}`,
                "kubernetes.io/role/elb": "1", // Tag for Kubernetes load balancer discovery
                Type: "Public",
            },
        });
        publicSubnets.push(subnet);
    }
    
    // Create private subnets
    for (let i = 0; i < privateCidrs.length; i++) {
        const subnet = new aws.ec2.Subnet(`${environment}-private-subnet-${i + 1}`, {
            vpcId: vpc.id,
            cidrBlock: privateCidrs[i],
            availabilityZone: getAzs.then(azs => azs.names[i % azs.names.length]),
            mapPublicIpOnLaunch: false,
            tags: {
                ...tags,
                Name: `${environment}-private-subnet-${i + 1}`,
                "kubernetes.io/role/internal-elb": "1", // Tag for Kubernetes internal load balancer discovery
                Type: "Private",
            },
        });
        privateSubnets.push(subnet);
    }
    
    return {
        public: publicSubnets,
        private: privateSubnets,
    };
}

/**
 * Creates NAT Gateways in public subnets for private subnet internet access
 * 
 * @param environment Deployment environment name
 * @param publicSubnets Public subnets where NAT Gateways will be created
 * @param tags Resource tags to apply
 * @returns Array of created NAT Gateway resources
 */
function createNatGateways(
    environment: string,
    publicSubnets: aws.ec2.Subnet[],
    tags: Record<string, string>
): aws.ec2.NatGateway[] {
    const natGateways: aws.ec2.NatGateway[] = [];
    
    // Create a NAT Gateway in each public subnet
    for (let i = 0; i < publicSubnets.length; i++) {
        // Create an Elastic IP for the NAT Gateway
        const eip = new aws.ec2.Eip(`${environment}-eip-${i + 1}`, {
            vpc: true,
            tags: {
                ...tags,
                Name: `${environment}-eip-${i + 1}`,
            },
        });
        
        // Create the NAT Gateway
        const natGateway = new aws.ec2.NatGateway(`${environment}-nat-${i + 1}`, {
            allocationId: eip.id,
            subnetId: publicSubnets[i].id,
            tags: {
                ...tags,
                Name: `${environment}-nat-${i + 1}`,
            },
        });
        
        natGateways.push(natGateway);
    }
    
    return natGateways;
}

/**
 * Creates and configures route tables for public and private subnets
 * 
 * @param environment Deployment environment name
 * @param vpc VPC where route tables will be created
 * @param internetGateway Internet Gateway for public route table
 * @param natGateways NAT Gateways for private route tables
 * @param publicSubnets Public subnets to associate with public route table
 * @param privateSubnets Private subnets to associate with private route tables
 * @param tags Resource tags to apply
 * @returns Created route table resources grouped by type
 */
function createRouteTables(
    environment: string,
    vpc: aws.ec2.Vpc,
    internetGateway: aws.ec2.InternetGateway,
    natGateways: aws.ec2.NatGateway[],
    publicSubnets: aws.ec2.Subnet[],
    privateSubnets: aws.ec2.Subnet[],
    tags: Record<string, string>
): RouteTableResources {
    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`${environment}-public-rt`, {
        vpcId: vpc.id,
        tags: {
            ...tags,
            Name: `${environment}-public-rt`,
            Type: "Public",
        },
    });
    
    // Create route to Internet Gateway
    new aws.ec2.Route(`${environment}-public-route`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: internetGateway.id,
    });
    
    // Associate public route table with public subnets
    for (let i = 0; i < publicSubnets.length; i++) {
        new aws.ec2.RouteTableAssociation(`${environment}-public-rt-assoc-${i + 1}`, {
            subnetId: publicSubnets[i].id,
            routeTableId: publicRouteTable.id,
        });
    }
    
    // Create private route tables (one per NAT Gateway for isolation)
    const privateRouteTables: aws.ec2.RouteTable[] = [];
    
    for (let i = 0; i < natGateways.length; i++) {
        const privateRouteTable = new aws.ec2.RouteTable(`${environment}-private-rt-${i + 1}`, {
            vpcId: vpc.id,
            tags: {
                ...tags,
                Name: `${environment}-private-rt-${i + 1}`,
                Type: "Private",
            },
        });
        
        // Create route to NAT Gateway
        new aws.ec2.Route(`${environment}-private-route-${i + 1}`, {
            routeTableId: privateRouteTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            natGatewayId: natGateways[i].id,
        });
        
        privateRouteTables.push(privateRouteTable);
    }
    
    // Associate private route tables with private subnets
    // Each private subnet uses the route table with the NAT Gateway in the same AZ
    for (let i = 0; i < privateSubnets.length; i++) {
        // Use modulo to handle cases where we have more subnets than NAT Gateways
        const rtIndex = i % privateRouteTables.length;
        
        new aws.ec2.RouteTableAssociation(`${environment}-private-rt-assoc-${i + 1}`, {
            subnetId: privateSubnets[i].id,
            routeTableId: privateRouteTables[rtIndex].id,
        });
    }
    
    return {
        public: publicRouteTable,
        private: privateRouteTables,
    };
}

/**
 * Creates security groups for different application components
 * 
 * @param environment Deployment environment name
 * @param vpc VPC where security groups will be created
 * @param tags Resource tags to apply
 * @returns Map of created security groups by name
 */
function createSecurityGroups(
    environment: string,
    vpc: aws.ec2.Vpc,
    tags: Record<string, string>
): Record<string, aws.ec2.SecurityGroup> {
    // Create ALB security group
    const albSg = new aws.ec2.SecurityGroup(`${environment}-alb-sg`, {
        vpcId: vpc.id,
        description: "Security group for Application Load Balancer",
        ingress: [
            // Allow HTTP from anywhere
            {
                protocol: "tcp",
                fromPort: 80,
                toPort: 80,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow HTTP traffic",
            },
            // Allow HTTPS from anywhere
            {
                protocol: "tcp",
                fromPort: 443,
                toPort: 443,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow HTTPS traffic",
            },
        ],
        egress: [
            // Allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow all outbound traffic",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-alb-sg`,
            Component: "LoadBalancer",
        },
    });
    
    // Create application security group
    const appSg = new aws.ec2.SecurityGroup(`${environment}-app-sg`, {
        vpcId: vpc.id,
        description: "Security group for application servers",
        ingress: [
            // Allow HTTP from ALB only
            {
                protocol: "tcp",
                fromPort: 3000,
                toPort: 3000,
                securityGroups: [albSg.id],
                description: "Allow HTTP traffic from ALB",
            },
            // Allow health check from ALB
            {
                protocol: "tcp",
                fromPort: 8080,
                toPort: 8080,
                securityGroups: [albSg.id],
                description: "Allow health check from ALB",
            },
        ],
        egress: [
            // Allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow all outbound traffic",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-app-sg`,
            Component: "Application",
        },
    });
    
    // Create database security group
    const dbSg = new aws.ec2.SecurityGroup(`${environment}-db-sg`, {
        vpcId: vpc.id,
        description: "Security group for database instances",
        ingress: [
            // Allow PostgreSQL from application only
            {
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
                securityGroups: [appSg.id],
                description: "Allow PostgreSQL access from application",
            },
        ],
        egress: [
            // Allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound traffic",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-db-sg`,
            Component: "Database",
        },
    });
    
    // Create Redis security group
    const redisSg = new aws.ec2.SecurityGroup(`${environment}-redis-sg`, {
        vpcId: vpc.id,
        description: "Security group for Redis instances",
        ingress: [
            // Allow Redis from application only
            {
                protocol: "tcp",
                fromPort: 6379,
                toPort: 6379,
                securityGroups: [appSg.id],
                description: "Allow Redis access from application",
            },
        ],
        egress: [
            // Allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow all outbound traffic",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-redis-sg`,
            Component: "Redis",
        },
    });
    
    // Create bastion host security group
    const bastionSg = new aws.ec2.SecurityGroup(`${environment}-bastion-sg`, {
        vpcId: vpc.id,
        description: "Security group for bastion hosts",
        ingress: [
            // Allow SSH from specific IP ranges (should be restricted further in production)
            {
                protocol: "tcp",
                fromPort: 22,
                toPort: 22,
                // This should be replaced with specific IP ranges in production
                cidrBlocks: ["0.0.0.0/0"],
                description: "Allow SSH access (restrict this in production)",
            },
        ],
        egress: [
            // Allow all outbound traffic
            {
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
                ipv6CidrBlocks: ["::/0"],
                description: "Allow all outbound traffic",
            },
        ],
        tags: {
            ...tags,
            Name: `${environment}-bastion-sg`,
            Component: "Bastion",
        },
    });
    
    return {
        alb: albSg,
        app: appSg,
        db: dbSg,
        redis: redisSg,
        bastion: bastionSg,
    };
}

/**
 * Creates Network ACLs for additional subnet security
 * 
 * @param environment Deployment environment name
 * @param vpc VPC where Network ACLs will be created
 * @param publicSubnets Public subnets to associate with public Network ACL
 * @param privateSubnets Private subnets to associate with private Network ACL
 * @param tags Resource tags to apply
 * @returns Created Network ACL resources grouped by type
 */
function createNetworkAcls(
    environment: string,
    vpc: aws.ec2.Vpc,
    publicSubnets: aws.ec2.Subnet[],
    privateSubnets: aws.ec2.Subnet[],
    tags: Record<string, string>
): NetworkAclResources {
    // Create public Network ACL
    const publicAcl = new aws.ec2.NetworkAcl(`${environment}-public-acl`, {
        vpcId: vpc.id,
        tags: {
            ...tags,
            Name: `${environment}-public-acl`,
            Type: "Public",
        },
    });
    
    // Create public Network ACL rules
    // Inbound rules
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-inbound-http`, {
        networkAclId: publicAcl.id,
        ruleNumber: 100,
        protocol: "tcp",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "0.0.0.0/0",
        fromPort: 80,
        toPort: 80,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-inbound-https`, {
        networkAclId: publicAcl.id,
        ruleNumber: 110,
        protocol: "tcp",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "0.0.0.0/0",
        fromPort: 443,
        toPort: 443,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-inbound-ssh`, {
        networkAclId: publicAcl.id,
        ruleNumber: 120,
        protocol: "tcp",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "0.0.0.0/0", // Should be restricted in production
        fromPort: 22,
        toPort: 22,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-inbound-ephemeral`, {
        networkAclId: publicAcl.id,
        ruleNumber: 130,
        protocol: "tcp",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "0.0.0.0/0",
        fromPort: 1024,
        toPort: 65535,
    });
    
    // Outbound rules
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-outbound-http`, {
        networkAclId: publicAcl.id,
        ruleNumber: 100,
        protocol: "tcp",
        ruleAction: "allow",
        egress: true,
        cidrBlock: "0.0.0.0/0",
        fromPort: 80,
        toPort: 80,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-outbound-https`, {
        networkAclId: publicAcl.id,
        ruleNumber: 110,
        protocol: "tcp",
        ruleAction: "allow",
        egress: true,
        cidrBlock: "0.0.0.0/0",
        fromPort: 443,
        toPort: 443,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-public-acl-outbound-ephemeral`, {
        networkAclId: publicAcl.id,
        ruleNumber: 120,
        protocol: "tcp",
        ruleAction: "allow",
        egress: true,
        cidrBlock: "0.0.0.0/0",
        fromPort: 1024,
        toPort: 65535,
    });
    
    // Create private Network ACL
    const privateAcl = new aws.ec2.NetworkAcl(`${environment}-private-acl`, {
        vpcId: vpc.id,
        tags: {
            ...tags,
            Name: `${environment}-private-acl`,
            Type: "Private",
        },
    });
    
    // Create private Network ACL rules
    // Inbound rules
    new aws.ec2.NetworkAclRule(`${environment}-private-acl-inbound-vpc`, {
        networkAclId: privateAcl.id,
        ruleNumber: 100,
        protocol: -1,
        ruleAction: "allow",
        egress: false,
        cidrBlock: vpc.cidrBlock,
        fromPort: 0,
        toPort: 0,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-private-acl-inbound-ephemeral`, {
        networkAclId: privateAcl.id,
        ruleNumber: 110,
        protocol: "tcp",
        ruleAction: "allow",
        egress: false,
        cidrBlock: "0.0.0.0/0",
        fromPort: 1024,
        toPort: 65535,
    });
    
    // Outbound rules
    new aws.ec2.NetworkAclRule(`${environment}-private-acl-outbound-http`, {
        networkAclId: privateAcl.id,
        ruleNumber: 100,
        protocol: "tcp",
        ruleAction: "allow",
        egress: true,
        cidrBlock: "0.0.0.0/0",
        fromPort: 80,
        toPort: 80,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-private-acl-outbound-https`, {
        networkAclId: privateAcl.id,
        ruleNumber: 110,
        protocol: "tcp",
        ruleAction: "allow",
        egress: true,
        cidrBlock: "0.0.0.0/0",
        fromPort: 443,
        toPort: 443,
    });
    
    new aws.ec2.NetworkAclRule(`${environment}-private-acl-outbound-vpc`, {
        networkAclId: privateAcl.id,
        ruleNumber: 120,
        protocol: -1,
        ruleAction: "allow",
        egress: true,
        cidrBlock: vpc.cidrBlock,
        fromPort: 0,
        toPort: 0,
    });
    
    // Associate ACLs with subnets
    for (let i = 0; i < publicSubnets.length; i++) {
        new aws.ec2.NetworkAclAssociation(`${environment}-public-acl-assoc-${i + 1}`, {
            networkAclId: publicAcl.id,
            subnetId: publicSubnets[i].id,
        });
    }
    
    for (let i = 0; i < privateSubnets.length; i++) {
        new aws.ec2.NetworkAclAssociation(`${environment}-private-acl-assoc-${i + 1}`, {
            networkAclId: privateAcl.id,
            subnetId: privateSubnets[i].id,
        });
    }
    
    return {
        public: publicAcl,
        private: privateAcl,
    };
}

/**
 * Sets up VPC Flow Logs for network traffic monitoring
 * 
 * @param environment Deployment environment name
 * @param vpc VPC to enable flow logs for
 * @param tags Resource tags to apply
 * @returns Created Flow Log resource
 */
function createVpcFlowLogs(
    environment: string,
    vpc: aws.ec2.Vpc,
    tags: Record<string, string>
): aws.ec2.FlowLog {
    // Create IAM role for Flow Logs
    const flowLogRole = new aws.iam.Role(`${environment}-flow-log-role`, {
        assumeRolePolicy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: "sts:AssumeRole",
                Effect: "Allow",
                Principal: {
                    Service: "vpc-flow-logs.amazonaws.com",
                },
            }],
        }),
        tags: {
            ...tags,
            Name: `${environment}-flow-log-role`,
        },
    });
    
    // Attach the necessary policy to the role
    new aws.iam.RolePolicy(`${environment}-flow-log-policy`, {
        role: flowLogRole.id,
        policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams",
                ],
                Effect: "Allow",
                Resource: "*",
            }],
        }),
    });
    
    // Create CloudWatch Log Group for Flow Logs
    const flowLogGroup = new aws.cloudwatch.LogGroup(`${environment}-flow-log-group`, {
        retentionInDays: 14,
        tags: {
            ...tags,
            Name: `${environment}-flow-log-group`,
        },
    });
    
    // Create VPC Flow Log
    const flowLog = new aws.ec2.FlowLog(`${environment}-flow-log`, {
        iamRoleArn: flowLogRole.arn,
        logDestination: flowLogGroup.arn,
        logDestinationType: "cloud-watch-logs",
        trafficType: "ALL",
        vpcId: vpc.id,
        tags: {
            ...tags,
            Name: `${environment}-flow-log`,
        },
    });
    
    return flowLog;
}

/**
 * Creates and configures all networking infrastructure components for the Revolucare platform
 * 
 * @param options Configuration options for the network infrastructure
 * @returns NetworkOutputs containing references to created network resources
 */
export function createNetworkInfrastructure(options: NetworkOptions): NetworkOutputs {
    const {
        environment,
        vpcCidr,
        publicSubnetCidrs,
        privateSubnetCidrs,
        tags,
    } = options;
    
    // Create VPC
    const vpc = createVpc(environment, vpcCidr, tags);
    
    // Create Internet Gateway
    const internetGateway = createInternetGateway(environment, vpc, tags);
    
    // Create Subnets
    const subnets = createSubnets(environment, vpc, publicSubnetCidrs, privateSubnetCidrs, tags);
    
    // Create NAT Gateways
    const natGateways = createNatGateways(environment, subnets.public, tags);
    
    // Create Route Tables
    const routeTables = createRouteTables(
        environment,
        vpc,
        internetGateway,
        natGateways,
        subnets.public,
        subnets.private,
        tags
    );
    
    // Create Security Groups
    const securityGroups = createSecurityGroups(environment, vpc, tags);
    
    // Create Network ACLs
    const networkAcls = createNetworkAcls(
        environment,
        vpc,
        subnets.public,
        subnets.private,
        tags
    );
    
    // Create VPC Flow Logs
    const flowLog = createVpcFlowLogs(environment, vpc, tags);
    
    // Return network infrastructure outputs
    return {
        vpcId: vpc.id,
        vpcCidr: vpc.cidrBlock,
        publicSubnetIds: subnets.public.map(subnet => subnet.id),
        privateSubnetIds: subnets.private.map(subnet => subnet.id),
        securityGroupIds: {
            alb: securityGroups.alb.id,
            app: securityGroups.app.id,
            db: securityGroups.db.id,
            redis: securityGroups.redis.id,
            bastion: securityGroups.bastion.id,
        },
        natGatewayIds: natGateways.map(natGw => natGw.id),
        routeTableIds: {
            public: [routeTables.public.id],
            private: routeTables.private.map(rt => rt.id),
        },
        flowLogId: flowLog.id,
    };
}