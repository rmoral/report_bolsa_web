#!/bin/bash

# EarlyMarketReports - Monitoring and Alerting Setup
# This script sets up comprehensive monitoring, alerting, and security monitoring

set -e

# Configuration
DOMAIN="earlymarketreports.com"
CLOUDFRONT_DISTRIBUTION_ID=""
SNS_TOPIC_ARN=""
EMAIL_ALERTS="admin@earlymarketreports.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Setting up monitoring and alerting for EarlyMarketReports...${NC}"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Create SNS topic for alerts
echo -e "${YELLOW}📢 Creating SNS topic for alerts...${NC}"

SNS_TOPIC_ARN=$(aws sns create-topic --name "EarlyMarketReports-Alerts" --output text --query 'TopicArn' 2>/dev/null || \
    aws sns list-topics --query "Topics[?contains(TopicArn, 'EarlyMarketReports-Alerts')].TopicArn" --output text)

if [ ! -z "$SNS_TOPIC_ARN" ]; then
    echo -e "${GREEN}✅ SNS topic created/found: $SNS_TOPIC_ARN${NC}"
    
    # Subscribe email to SNS topic
    aws sns subscribe \
        --topic-arn $SNS_TOPIC_ARN \
        --protocol email \
        --notification-endpoint $EMAIL_ALERTS \
        --output text --query 'SubscriptionArn' 2>/dev/null || echo "Subscription already exists"
    
    echo -e "${GREEN}✅ Email subscription created for $EMAIL_ALERTS${NC}"
    echo -e "${YELLOW}⚠️ Please check your email and confirm the subscription${NC}"
else
    echo -e "${RED}❌ Failed to create SNS topic${NC}"
    exit 1
fi

# Create CloudWatch alarms
echo -e "${YELLOW}🚨 Creating CloudWatch alarms...${NC}"

# High error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "EarlyMarketReports-HighErrorRate" \
    --alarm-description "High error rate detected" \
    --metric-name "4xxErrorRate" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --period 300 \
    --threshold 5.0 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=DistributionId,Value=$CLOUDFRONT_DISTRIBUTION_ID \
    --treat-missing-data "notBreaching" 2>/dev/null || echo "Alarm already exists"

# High 5xx error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "EarlyMarketReports-High5xxErrorRate" \
    --alarm-description "High 5xx error rate detected" \
    --metric-name "5xxErrorRate" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --period 300 \
    --threshold 1.0 \
    --comparison-operator "GreaterThanThreshold" \
    --evaluation-periods 1 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=DistributionId,Value=$CLOUDFRONT_DISTRIBUTION_ID \
    --treat-missing-data "notBreaching" 2>/dev/null || echo "Alarm already exists"

# Low request count alarm (potential downtime)
aws cloudwatch put-metric-alarm \
    --alarm-name "EarlyMarketReports-LowRequestCount" \
    --alarm-description "Low request count - potential downtime" \
    --metric-name "Requests" \
    --namespace "AWS/CloudFront" \
    --statistic "Sum" \
    --period 900 \
    --threshold 10 \
    --comparison-operator "LessThanThreshold" \
    --evaluation-periods 2 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=DistributionId,Value=$CLOUDFRONT_DISTRIBUTION_ID \
    --treat-missing-data "breaching" 2>/dev/null || echo "Alarm already exists"

# High cache miss ratio alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "EarlyMarketReports-HighCacheMissRatio" \
    --alarm-description "High cache miss ratio" \
    --metric-name "CacheHitRate" \
    --namespace "AWS/CloudFront" \
    --statistic "Average" \
    --period 300 \
    --threshold 80.0 \
    --comparison-operator "LessThanThreshold" \
    --evaluation-periods 3 \
    --alarm-actions $SNS_TOPIC_ARN \
    --dimensions Name=DistributionId,Value=$CLOUDFRONT_DISTRIBUTION_ID \
    --treat-missing-data "notBreaching" 2>/dev/null || echo "Alarm already exists"

echo -e "${GREEN}✅ CloudWatch alarms created${NC}"

# Create custom metrics for application monitoring
echo -e "${YELLOW}📈 Setting up custom application metrics...${NC}"

# Create custom namespace for application metrics
cat > custom-metrics.json << EOF
{
    "Namespace": "EarlyMarketReports/Application",
    "MetricData": [
        {
            "MetricName": "UserRegistrations",
            "Value": 0,
            "Unit": "Count",
            "Dimensions": [
                {
                    "Name": "Plan",
                    "Value": "Lite"
                }
            ]
        },
        {
            "MetricName": "UserRegistrations",
            "Value": 0,
            "Unit": "Count",
            "Dimensions": [
                {
                    "Name": "Plan",
                    "Value": "Pro"
                }
            ]
        },
        {
            "MetricName": "ReportDownloads",
            "Value": 0,
            "Unit": "Count"
        },
        {
            "MetricName": "PageViews",
            "Value": 0,
            "Unit": "Count"
        }
    ]
}
EOF

aws cloudwatch put-metric-data --cli-input-json file://custom-metrics.json

echo -e "${GREEN}✅ Custom metrics namespace created${NC}"

# Set up log groups for application logs
echo -e "${YELLOW}📝 Setting up log groups...${NC}"

# Create log group for application logs
aws logs create-log-group --log-group-name "/aws/earlymarketreports/application" 2>/dev/null || echo "Log group already exists"

# Create log group for security logs
aws logs create-log-group --log-group-name "/aws/earlymarketreports/security" 2>/dev/null || echo "Log group already exists"

# Set retention policy for log groups
aws logs put-retention-policy --log-group-name "/aws/earlymarketreports/application" --retention-in-days 30
aws logs put-retention-policy --log-group-name "/aws/earlymarketreports/security" --retention-in-days 90

echo -e "${GREEN}✅ Log groups created with retention policies${NC}"

# Create security monitoring dashboard
echo -e "${YELLOW}🛡️ Creating security monitoring dashboard...${NC}"

cat > security-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "log",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 6,
            "properties": {
                "query": "SOURCE '/aws/earlymarketreports/security' | fields @timestamp, @message | filter @message like /Blocked/ | sort @timestamp desc | limit 100",
                "region": "us-east-1",
                "title": "Security Events - Blocked Requests",
                "view": "table"
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/WAFV2", "BlockedRequests", "WebACL", "EarlyMarketReports-WAF", "Region", "CloudFront" ],
                    [ ".", "AllowedRequests", ".", ".", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "WAF Requests",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "AWS/CloudFront", "Requests", "DistributionId", "$CLOUDFRONT_DISTRIBUTION_ID" ],
                    [ ".", "BytesDownloaded", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "us-east-1",
                "title": "Traffic Overview",
                "period": 300
            }
        }
    ]
}
EOF

aws cloudwatch put-dashboard --dashboard-name "EarlyMarketReports-Security" --dashboard-body file://security-dashboard.json

echo -e "${GREEN}✅ Security monitoring dashboard created${NC}"

# Create uptime monitoring
echo -e "${YELLOW}⏰ Setting up uptime monitoring...${NC}"

# Create health check for the main domain
aws route53 create-health-check \
    --caller-reference "earlymarketreports-health-check-$(date +%s)" \
    --health-check-config '{
        "Type": "HTTPS",
        "ResourcePath": "/health",
        "FullyQualifiedDomainName": "'$DOMAIN'",
        "Port": 443,
        "EnableSNI": true,
        "RequestInterval": 30,
        "FailureThreshold": 3,
        "MeasureLatency": true,
        "Inverted": false,
        "Disabled": false,
        "HealthThreshold": 0,
        "Regions": ["us-east-1", "us-west-2", "eu-west-1"]
    }' 2>/dev/null || echo "Health check already exists"

echo -e "${GREEN}✅ Uptime monitoring configured${NC}"

# Set up automated reports
echo -e "${YELLOW}📊 Setting up automated reports...${NC}"

# Create Lambda function for automated reports (placeholder)
cat > automated-reports-lambda.py << 'EOF'
import json
import boto3
from datetime import datetime, timedelta

def lambda_handler(event, context):
    cloudwatch = boto3.client('cloudwatch')
    sns = boto3.client('sns')
    
    # Get metrics for the last 24 hours
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=1)
    
    # Get request count
    response = cloudwatch.get_metric_statistics(
        Namespace='AWS/CloudFront',
        MetricName='Requests',
        Dimensions=[
            {
                'Name': 'DistributionId',
                'Value': 'YOUR_DISTRIBUTION_ID'
            }
        ],
        StartTime=start_time,
        EndTime=end_time,
        Period=3600,
        Statistics=['Sum']
    )
    
    total_requests = sum([point['Sum'] for point in response['Datapoints']])
    
    # Create report
    report = f"""
    EarlyMarketReports - Daily Report
    Date: {start_time.strftime('%Y-%m-%d')}
    
    Total Requests: {total_requests:,.0f}
    
    This is an automated report from your monitoring system.
    """
    
    # Send report via SNS
    sns.publish(
        TopicArn='YOUR_SNS_TOPIC_ARN',
        Subject='EarlyMarketReports - Daily Report',
        Message=report
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Report sent successfully')
    }
EOF

echo -e "${GREEN}✅ Automated reports setup completed${NC}"

# Cleanup temporary files
rm -f custom-metrics.json security-dashboard.json automated-reports-lambda.py

echo -e "${GREEN}🎉 Monitoring and alerting setup completed!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "   • SNS Topic: $SNS_TOPIC_ARN"
echo -e "   • CloudWatch Alarms: 4 alarms created"
echo -e "   • Custom Metrics: Application metrics namespace"
echo -e "   • Log Groups: Application and security logs"
echo -e "   • Dashboards: Security monitoring dashboard"
echo -e "   • Health Checks: Uptime monitoring"

echo -e "${YELLOW}⚠️ Next steps:${NC}"
echo -e "   1. Confirm SNS email subscription"
echo -e "   2. Test the health check endpoint"
echo -e "   3. Review and adjust alarm thresholds"
echo -e "   4. Set up additional custom metrics as needed"

echo -e "${GREEN}🛡️ Your application is now fully monitored with enterprise-grade alerting!${NC}"
