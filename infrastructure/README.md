# Revolucare Infrastructure

This directory contains all infrastructure-related configurations, scripts, and documentation for the Revolucare platform. The infrastructure is designed to be cloud-native, scalable, and secure, following best practices for healthcare applications.

## Overview

Revolucare uses a multi-cloud approach with Vercel for Next.js application hosting and AWS for data services and specialized functionality. The infrastructure is defined as code using Pulumi, enabling consistent and repeatable deployments across environments.

## Directory Structure

```
infrastructure/
├── pulumi/                 # Infrastructure as Code using Pulumi
├── docker/                 # Docker configurations for containerized components
├── kubernetes/             # Kubernetes deployment configurations
├── monitoring/             # Prometheus and Grafana configurations
├── security/               # Security policies and certificates
├── database/               # Database migrations and backup configurations
├── ci-cd/                  # CI/CD pipeline configurations
├── scripts/                # Utility scripts for infrastructure management
└── environments/           # Environment-specific configurations
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/)
- [AWS CLI](https://aws.amazon.com/cli/)
- [Docker](https://www.docker.com/get-started)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) (for Kubernetes deployments)

### Local Development Environment

To set up a local development environment with Docker:

```bash
cd infrastructure/docker/backend
docker-compose up -d
```

This will start the necessary services (PostgreSQL, Redis) for local development.

## Deployment

### Infrastructure Deployment

The infrastructure is deployed using Pulumi:

```bash
cd infrastructure/pulumi
pulumi stack select dev  # or staging, prod
pulumi up
```

### Application Deployment

Application deployment is handled through CI/CD pipelines defined in `.github/workflows/`. The pipelines are triggered on pushes to specific branches:

- `main` → Development environment
- `staging` → Staging environment
- `production` → Production environment

## Environments

| Environment | Purpose | Cloud Region | Deployment Method |
|-------------|---------|--------------|-------------------|
| Development | Feature development, testing | US East | Automatic on push to main |
| Staging | Integration testing, UAT | US East | Manual approval after dev tests |
| Production | Live system | US East (primary), US West (DR) | Manual approval after staging tests |

## Infrastructure Components

### Cloud Services

- **Vercel**: Next.js application hosting, Serverless Functions, Edge Network
- **AWS RDS**: PostgreSQL database with Multi-AZ deployment
- **AWS ElastiCache**: Redis for caching and real-time features
- **AWS S3**: Document storage with cross-region replication
- **AWS Lambda**: Serverless functions for AI processing
- **AWS CloudFront**: CDN for static assets

### Containerization

Docker containers are used for:

- Background workers for AI tasks
- Data processing for analytics
- Local development environment

### Monitoring

The monitoring stack includes:

- Prometheus for metrics collection
- Grafana for visualization
- Loki for log aggregation
- Alerting rules for critical system components

### Security

Security measures include:

- TLS encryption for all communications
- Network isolation with VPC and security groups
- IAM with least privilege access
- Encryption at rest for all sensitive data
- Regular security scanning and updates

## Backup and Disaster Recovery

- Daily database backups with point-in-time recovery
- Cross-region replication for critical data
- Automated backup verification
- Documented recovery procedures

## Maintenance

### Scaling

The infrastructure is designed to scale automatically based on demand:

- Vercel automatically scales the application tier
- AWS Auto Scaling for containerized components
- Database read replicas for query-heavy operations

### Monitoring and Alerting

Monitoring is set up to track:

- System health and performance
- Resource utilization
- Error rates and application issues
- Business metrics

Alerts are configured to notify the operations team of critical issues.

## Documentation

Additional documentation:

- [Pulumi Setup](./pulumi/README.md)
- [Docker Configuration](./docker/README.md)
- [Kubernetes Deployment](./kubernetes/README.md)
- [Monitoring Configuration](./monitoring/README.md)
- [Security Policies](./security/README.md)

## Contributing

When contributing to the infrastructure:

1. Create a feature branch from `main`
2. Make your changes
3. Test in a development environment
4. Submit a pull request
5. Wait for review and approval

## Troubleshooting

Common issues and their solutions:

- **Deployment Failures**: Check the CI/CD pipeline logs for specific errors
- **Database Connectivity**: Verify security group rules and network ACLs
- **Performance Issues**: Review monitoring dashboards for bottlenecks

## Contact

For infrastructure-related questions, contact the DevOps team.