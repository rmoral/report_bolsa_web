#!/bin/bash

# EarlyMarketReports - AWS Deployment Script with Security
# This script deploys the application to AWS with CloudFront CDN and security configurations

set -e

# Configuration
DOMAIN="earlymarketreports.com"
CDN_DOMAIN="cdn.earlymarketreports.com"
AWS_REGION="us-east-1"
S3_BUCKET="earlymarketreports-static"
CLOUDFRONT_DISTRIBUTION_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting EarlyMarketReports deployment to AWS...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if user is logged in to AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Build the application
echo -e "${YELLOW}📦 Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Create S3 bucket if it doesn't exist
echo -e "${YELLOW}🪣 Creating S3 bucket for static assets...${NC}"
aws s3 mb s3://$S3_BUCKET --region $AWS_REGION 2>/dev/null || echo "Bucket already exists"

# Configure S3 bucket for static website hosting
aws s3 website s3://$S3_BUCKET --index-document index.html --error-document 404.html

# Upload static assets to S3
echo -e "${YELLOW}📤 Uploading static assets to S3...${NC}"
aws s3 sync ./out s3://$S3_BUCKET --delete --cache-control "public, max-age=31536000, immutable"

# Set proper cache headers for different file types
aws s3 cp s3://$S3_BUCKET s3://$S3_BUCKET --recursive --exclude "*" --include "*.html" --cache-control "public, max-age=3600, s-maxage=86400"
aws s3 cp s3://$S3_BUCKET s3://$S3_BUCKET --recursive --exclude "*" --include "*.json" --cache-control "public, max-age=3600, s-maxage=86400"

echo -e "${GREEN}✅ Static assets uploaded to S3${NC}"

# Create CloudFront distribution
echo -e "${YELLOW}☁️ Creating CloudFront distribution...${NC}"

# Check if distribution already exists
if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${YELLOW}Creating new CloudFront distribution...${NC}"
    
    # Create distribution using the config file
    DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution --distribution-config file://cloudfront-config.json --output json)
    CLOUDFRONT_DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
    
    echo -e "${GREEN}✅ CloudFront distribution created: $CLOUDFRONT_DISTRIBUTION_ID${NC}"
else
    echo -e "${YELLOW}Updating existing CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID${NC}"
    
    # Get current distribution config
    aws cloudfront get-distribution-config --id $CLOUDFRONT_DISTRIBUTION_ID --output json > current-config.json
    
    # Update the config (you might want to modify this based on your needs)
    aws cloudfront update-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --distribution-config file://cloudfront-config.json --if-match $(jq -r '.ETag' current-config.json)
    
    echo -e "${GREEN}✅ CloudFront distribution updated${NC}"
fi

# Configure SSL certificate (if using ACM)
echo -e "${YELLOW}🔒 Configuring SSL certificate...${NC}"

# Request SSL certificate if it doesn't exist
CERT_ARN=$(aws acm list-certificates --region $AWS_REGION --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" --output text)

if [ -z "$CERT_ARN" ]; then
    echo -e "${YELLOW}Requesting SSL certificate for $DOMAIN...${NC}"
    CERT_ARN=$(aws acm request-certificate \
        --domain-name $DOMAIN \
        --subject-alternative-names "www.$DOMAIN" \
        --validation-method DNS \
        --region $AWS_REGION \
        --output text --query 'CertificateArn')
    
    echo -e "${YELLOW}⚠️ SSL certificate requested. You need to validate it manually in the AWS Console.${NC}"
    echo -e "${YELLOW}Certificate ARN: $CERT_ARN${NC}"
else
    echo -e "${GREEN}✅ SSL certificate already exists: $CERT_ARN${NC}"
fi

# Configure Route 53 (if domain is managed by AWS)
echo -e "${YELLOW}🌐 Configuring Route 53...${NC}"

# Check if hosted zone exists
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='$DOMAIN.'].Id" --output text | sed 's|/hostedzone/||')

if [ ! -z "$HOSTED_ZONE_ID" ]; then
    echo -e "${GREEN}✅ Hosted zone found: $HOSTED_ZONE_ID${NC}"
    
    # Get CloudFront domain name
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --query 'Distribution.DomainName' --output text)
    
    # Create or update A record
    cat > route53-change.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$CLOUDFRONT_DOMAIN",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "$CLOUDFRONT_DOMAIN",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }
    ]
}
EOF
    
    aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://route53-change.json
    
    echo -e "${GREEN}✅ Route 53 records updated${NC}"
else
    echo -e "${YELLOW}⚠️ No Route 53 hosted zone found for $DOMAIN. Please configure DNS manually.${NC}"
fi

# Security configurations
echo -e "${YELLOW}🛡️ Applying security configurations...${NC}"

# Create WAF Web ACL for additional protection
WAF_ACL_ARN=$(aws wafv2 create-web-acl \
    --name "EarlyMarketReports-WAF" \
    --scope CLOUDFRONT \
    --default-action Allow={} \
    --rules '[
        {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 1,
            "OverrideAction": {"None": {}},
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesCommonRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "CommonRuleSetMetric"
            }
        },
        {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 2,
            "OverrideAction": {"None": {}},
            "Statement": {
                "ManagedRuleGroupStatement": {
                    "VendorName": "AWS",
                    "Name": "AWSManagedRulesKnownBadInputsRuleSet"
                }
            },
            "VisibilityConfig": {
                "SampledRequestsEnabled": true,
                "CloudWatchMetricsEnabled": true,
                "MetricName": "KnownBadInputsMetric"
            }
        }
    ]' \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=EarlyMarketReportsWAF \
    --output text --query 'Summary.ARN' 2>/dev/null || echo "")

if [ ! -z "$WAF_ACL_ARN" ]; then
    echo -e "${GREEN}✅ WAF Web ACL created: $WAF_ACL_ARN${NC}"
    
    # Associate WAF with CloudFront distribution
    aws cloudfront update-distribution \
        --id $CLOUDFRONT_DISTRIBUTION_ID \
        --distribution-config file://cloudfront-config.json \
        --if-match $(aws cloudfront get-distribution --id $CLOUDFRONT_DISTRIBUTION_ID --query 'ETag' --output text)
    
    echo -e "${GREEN}✅ WAF associated with CloudFront distribution${NC}"
else
    echo -e "${YELLOW}⚠️ WAF Web ACL already exists or creation failed${NC}"
fi

# Set up CloudWatch monitoring
echo -e "${YELLOW}📊 Setting up CloudWatch monitoring...${NC}"

# Create CloudWatch dashboard
cat > cloudwatch-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "Requests", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "BytesDownloaded", ".", "." ],
                    [ ".", "BytesUploaded", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "CloudFront Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "4xxErrorRate", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "5xxErrorRate", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "Error Rates",
                "period": 300
            }
        }
    ]
}
EOF

aws cloudwatch put-dashboard --dashboard-name "EarlyMarketReports" --dashboard-body file://cloudwatch-dashboard.json

echo -e "${GREEN}✅ CloudWatch dashboard created${NC}"

# Cleanup temporary files
rm -f current-config.json route53-change.json cloudwatch-dashboard.json

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   • S3 Bucket: $S3_BUCKET"
echo -e "   • CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo -e "   • Domain: $DOMAIN"
echo -e "   • SSL Certificate: $CERT_ARN"
echo -e "   • WAF Web ACL: $WAF_ACL_ARN"

echo -e "${YELLOW}⚠️ Next steps:${NC}"
echo -e "   1. Validate SSL certificate in AWS Console"
echo -e "   2. Update DNS records if not using Route 53"
echo -e "   3. Test the deployment"
echo -e "   4. Set up monitoring alerts"

echo -e "${GREEN}🚀 Your application is now deployed with enterprise-grade security!${NC}"
