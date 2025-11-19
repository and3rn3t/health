#!/usr/bin/env node

/**
 * VitalSense Production Documentation Generator
 * Task 3: Generate comprehensive production documentation and deployment guides
 */

import { promises as fs } from 'fs';
import path from 'path';

class ProductionDocumentationGenerator {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.docsGenerated = [];
    this.deploymentGuides = [];
  }

  log(level, message, component = null) {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      docs: '📚',
      deploy: '🚀',
      api: '🔗',
    };

    const prefix = component ? `[${component}] ` : '';
    console.log(`${icons[level] || '📋'} [${timestamp}] ${prefix}${message}`);
  }

  async generateAPIDocumentation() {
    this.log('api', 'Generating comprehensive API documentation...', 'API');

    const apiDoc = {
      title: 'VitalSense API Documentation',
      version: '1.0.0',
      baseUrl: 'https://health.andernet.dev',
      description:
        'Comprehensive API for VitalSense health monitoring and ML analysis',
      lastUpdated: new Date().toISOString(),
      endpoints: {
        health: {
          method: 'GET',
          path: '/health',
          description: 'System health check endpoint',
          response: {
            status: 'string',
            timestamp: 'ISO string',
            service: 'string',
          },
          example: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            service: 'VitalSense Worker',
          },
        },
        mlAnalyze: {
          method: 'POST',
          path: '/ml/analyze',
          description: 'Machine Learning health data analysis',
          requestBody: {
            heartRate: 'number (optional)',
            steps: 'number (optional)',
            bloodPressure: 'array [systolic, diastolic] (optional)',
            timestamp: 'ISO string (optional)',
          },
          response: {
            analysis: {
              healthScore: 'number (0-100)',
              recommendations: 'array of strings',
              predictions: 'array of objects',
              insights: 'array of objects',
            },
            timestamp: 'ISO string',
            processingTime: 'number (ms)',
          },
          example: {
            request: {
              heartRate: 72,
              steps: 8500,
              bloodPressure: [120, 80],
              timestamp: new Date().toISOString(),
            },
            response: {
              analysis: {
                healthScore: 85,
                recommendations: [
                  'Maintain current activity level',
                  'Consider increasing cardio workouts',
                ],
                predictions: [
                  {
                    type: 'health_trend',
                    confidence: 0.87,
                    prediction: 'Stable health trajectory',
                  },
                ],
                insights: [
                  {
                    category: 'activity',
                    insight: 'Above average daily steps',
                  },
                ],
              },
              timestamp: new Date().toISOString(),
              processingTime: 245,
            },
          },
        },
        healthData: {
          method: 'POST',
          path: '/api/health-data',
          description: 'Store and process health data',
          requestBody: {
            userId: 'string',
            metrics: 'object with health metrics',
            timestamp: 'ISO string',
          },
          response: {
            id: 'string',
            status: 'string',
            processed: 'boolean',
          },
        },
        websocketML: {
          protocol: 'WebSocket',
          url: 'wss://vitalsense-websocket-advanced-prod.andernet.workers.dev',
          description: 'Real-time ML analysis via WebSocket',
          messageTypes: {
            ml_analysis_request: {
              type: 'ml_analysis_request',
              data: 'health metrics object',
            },
            ml_analysis_response: {
              type: 'ml_analysis_response',
              data: 'ML analysis results',
            },
            health_update: {
              type: 'health_update',
              data: 'real-time health data',
            },
          },
        },
      },
      authentication: {
        type: 'JWT',
        header: 'Authorization: Bearer <token>',
        description: 'JWT tokens for device authentication',
      },
      errorHandling: {
        400: 'Bad Request - Invalid input data',
        401: 'Unauthorized - Invalid or missing authentication',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error - Server-side error',
      },
      rateLimits: {
        '/ml/analyze': '100 requests per minute',
        '/api/health-data': '200 requests per minute',
        WebSocket: '50 connections per IP',
      },
    };

    const apiDocPath = path.join(
      this.workspaceRoot,
      'docs',
      'API_DOCUMENTATION.md'
    );
    await this.ensureDirectoryExists(path.dirname(apiDocPath));

    const markdown = this.generateAPIMarkdown(apiDoc);
    await fs.writeFile(apiDocPath, markdown);

    this.docsGenerated.push({
      type: 'API Documentation',
      path: apiDocPath,
      size: markdown.length,
    });

    this.log('success', `API documentation generated: ${apiDocPath}`, 'API');
    return apiDoc;
  }

  generateAPIMarkdown(apiDoc) {
    return `# ${apiDoc.title}

**Version:** ${apiDoc.version}
**Base URL:** ${apiDoc.baseUrl}
**Last Updated:** ${new Date(apiDoc.lastUpdated).toLocaleDateString()}

## Overview
${apiDoc.description}

## Authentication
- **Type:** ${apiDoc.authentication.type}
- **Header:** \`${apiDoc.authentication.header}\`
- **Description:** ${apiDoc.authentication.description}

## Endpoints

### Health Check
- **Method:** ${apiDoc.endpoints.health.method}
- **Path:** \`${apiDoc.endpoints.health.path}\`
- **Description:** ${apiDoc.endpoints.health.description}

**Response:**
\`\`\`json
${JSON.stringify(apiDoc.endpoints.health.example, null, 2)}
\`\`\`

### ML Analysis
- **Method:** ${apiDoc.endpoints.mlAnalyze.method}
- **Path:** \`${apiDoc.endpoints.mlAnalyze.path}\`
- **Description:** ${apiDoc.endpoints.mlAnalyze.description}

**Request Body:**
\`\`\`json
${JSON.stringify(apiDoc.endpoints.mlAnalyze.example.request, null, 2)}
\`\`\`

**Response:**
\`\`\`json
${JSON.stringify(apiDoc.endpoints.mlAnalyze.example.response, null, 2)}
\`\`\`

### Health Data Storage
- **Method:** ${apiDoc.endpoints.healthData.method}
- **Path:** \`${apiDoc.endpoints.healthData.path}\`
- **Description:** ${apiDoc.endpoints.healthData.description}

### WebSocket ML
- **Protocol:** ${apiDoc.endpoints.websocketML.protocol}
- **URL:** \`${apiDoc.endpoints.websocketML.url}\`
- **Description:** ${apiDoc.endpoints.websocketML.description}

**Message Types:**
- \`ml_analysis_request\`: Request ML analysis
- \`ml_analysis_response\`: Receive ML results
- \`health_update\`: Real-time health updates

## Error Handling
${Object.entries(apiDoc.errorHandling)
  .map(([code, desc]) => `- **${code}:** ${desc}`)
  .join('\n')}

## Rate Limits
${Object.entries(apiDoc.rateLimits)
  .map(([endpoint, limit]) => `- **${endpoint}:** ${limit}`)
  .join('\n')}

---
Generated on ${new Date().toLocaleDateString()} by VitalSense Documentation Generator
`;
  }

  async generateDeploymentGuide() {
    this.log('deploy', 'Generating production deployment guide...', 'DEPLOY');

    const deploymentGuide = `# VitalSense Production Deployment Guide

## Prerequisites
- Cloudflare account with Workers plan
- Node.js 18+ installed
- Git repository access
- DNS management access

## Step-by-Step Deployment

### 1. Environment Setup
\`\`\`bash
# Clone repository
git clone <repository-url>
cd health

# Install dependencies
npm install

# Configure environment
cp .env.example .env.production
# Edit .env.production with production values
\`\`\`

### 2. Cloudflare Configuration
\`\`\`bash
# Login to Cloudflare
wrangler login

# Create KV namespaces
wrangler kv:namespace create "HEALTH_ANALYTICS"
wrangler kv:namespace create "HEALTH_ANALYTICS" --preview

# Update wrangler.toml with namespace IDs
\`\`\`

### 3. Build and Deploy
\`\`\`bash
# Build production assets
npm run build

# Deploy Worker
wrangler deploy --env production

# Deploy WebSocket services
wrangler deploy --env websocket
\`\`\`

### 4. DNS Configuration
\`\`\`bash
# Configure custom domain
wrangler custom-domains add health.andernet.dev

# Verify DNS propagation
nslookup health.andernet.dev
\`\`\`

### 5. Verification
\`\`\`bash
# Test health endpoint
curl https://health.andernet.dev/health

# Test ML endpoint
curl -X POST https://health.andernet.dev/ml/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"heartRate": 72, "steps": 8500}'

# Test WebSocket
# Use browser or WebSocket client to connect to:
# wss://vitalsense-websocket-advanced-prod.andernet.workers.dev
\`\`\`

## Production Checklist
- [ ] Environment variables configured
- [ ] KV namespaces created and bound
- [ ] Custom domains configured
- [ ] SSL certificates active
- [ ] Rate limiting configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented
- [ ] Security headers configured

## Monitoring
- **Health checks:** \`/health\` endpoint
- **Metrics:** Cloudflare Analytics dashboard
- **Logs:** \`wrangler tail --env production\`
- **Alerts:** Configure based on error rates and response times

## Rollback Procedure
\`\`\`bash
# Deploy previous version
wrangler rollback --env production

# Or deploy specific version
git checkout <previous-tag>
wrangler deploy --env production
\`\`\`

## Security Considerations
- JWT tokens for authentication
- CORS properly configured
- Rate limiting active
- Input validation on all endpoints
- Sensitive data encrypted
- Regular security updates

## Support
- **Documentation:** /docs folder
- **Issues:** GitHub Issues
- **Monitoring:** Cloudflare dashboard
`;

    const deployGuidePath = path.join(
      this.workspaceRoot,
      'docs',
      'PRODUCTION_DEPLOYMENT.md'
    );
    await fs.writeFile(deployGuidePath, deploymentGuide);

    this.deploymentGuides.push({
      type: 'Production Deployment Guide',
      path: deployGuidePath,
      size: deploymentGuide.length,
    });

    this.log(
      'success',
      `Deployment guide generated: ${deployGuidePath}`,
      'DEPLOY'
    );
    return deploymentGuide;
  }

  async generateOperationalGuide() {
    this.log('docs', 'Generating operational procedures guide...', 'OPS');

    const operationalGuide = `# VitalSense Operational Procedures

## Daily Operations

### Health Monitoring
1. Check system health: \`curl https://health.andernet.dev/health\`
2. Review Cloudflare Analytics for traffic patterns
3. Monitor error rates and response times
4. Check WebSocket connection stability

### Performance Monitoring
- **Frontend:** Target <1000ms response time
- **ML Analysis:** Target <2000ms processing time
- **WebSocket:** Target <3000ms connection time
- **Overall uptime:** Target >99.9%

## Weekly Maintenance

### System Updates
1. Review and apply security updates
2. Update dependencies: \`npm audit fix\`
3. Run performance tests
4. Review and rotate logs

### Data Management
1. Review KV storage usage
2. Clean up old analytics data
3. Backup critical configurations
4. Validate data integrity

## Incident Response

### High Priority Issues
- **Service Down:** Check Cloudflare status, redeploy if needed
- **High Error Rates:** Check logs, investigate root cause
- **Performance Degradation:** Review metrics, scale if needed
- **Security Incidents:** Follow security incident response plan

### Troubleshooting Steps
1. **Check service status:** \`curl https://health.andernet.dev/health\`
2. **Review logs:** \`wrangler tail --env production\`
3. **Check DNS:** \`nslookup health.andernet.dev\`
4. **Test endpoints:** Use automated testing scripts
5. **Monitor metrics:** Cloudflare Analytics dashboard

## Scaling Procedures

### Horizontal Scaling
- Cloudflare Workers automatically scale
- Monitor CPU and memory usage
- Increase rate limits if needed

### Vertical Scaling
- Upgrade Cloudflare plan if needed
- Optimize code for better performance
- Implement caching strategies

## Security Procedures

### Regular Security Tasks
- Review access logs weekly
- Update security policies monthly
- Conduct security audits quarterly
- Test incident response annually

### Security Incident Response
1. **Identify and contain:** Isolate affected systems
2. **Assess impact:** Determine scope and severity
3. **Communicate:** Notify stakeholders
4. **Remediate:** Fix vulnerabilities
5. **Document:** Record lessons learned

## Backup and Recovery

### Backup Strategy
- **Code:** Git repository with tags
- **Configuration:** Store in secure location
- **Data:** Regular KV namespace exports
- **Documentation:** Version controlled

### Recovery Procedures
1. **Service Recovery:** Redeploy from known good state
2. **Data Recovery:** Restore from KV backups
3. **Configuration Recovery:** Apply from backup
4. **Testing:** Verify all systems operational

## Contact Information
- **On-call Engineer:** [Contact Details]
- **System Administrator:** [Contact Details]
- **Security Team:** [Contact Details]
- **Management:** [Contact Details]
`;

    const opsGuidePath = path.join(
      this.workspaceRoot,
      'docs',
      'OPERATIONAL_PROCEDURES.md'
    );
    await fs.writeFile(opsGuidePath, operationalGuide);

    this.docsGenerated.push({
      type: 'Operational Procedures',
      path: opsGuidePath,
      size: operationalGuide.length,
    });

    this.log('success', `Operational guide generated: ${opsGuidePath}`, 'OPS');
    return operationalGuide;
  }

  async generateArchitectureDoc() {
    this.log('docs', 'Generating system architecture documentation...', 'ARCH');

    const architectureDoc = `# VitalSense System Architecture

## Overview
VitalSense is a comprehensive health monitoring system built on Cloudflare Workers with advanced ML capabilities for real-time health data analysis and insights.

## System Components

### Frontend (React + Vite)
- **Technology:** React 19, TypeScript, Tailwind CSS
- **Build Tool:** Vite with optimized production builds
- **Deployment:** Static assets served by Cloudflare Worker
- **Features:** PWA capabilities, real-time updates, responsive design

### Backend Services

#### Cloudflare Worker (Primary)
- **Runtime:** V8 isolates on Cloudflare Edge
- **Framework:** Hono for routing and middleware
- **Features:** API endpoints, static asset serving, KV storage
- **Scaling:** Automatic horizontal scaling

#### ML Analysis Service
- **Port:** 3002 (development)
- **Technology:** Node.js + Express
- **Features:** Advanced health data processing, ML predictions
- **Integration:** RESTful API with comprehensive analysis

#### WebSocket Service
- **Technology:** Cloudflare Workers with WebSocket support
- **Features:** Real-time ML analysis, live health updates
- **Scaling:** Edge deployment for low latency

### Data Layer

#### Cloudflare KV
- **Purpose:** Health analytics data storage
- **Features:** Global replication, high availability
- **Usage:** User data, analytics, session storage

#### Local Storage (Client)
- **Purpose:** User preferences, cached data
- **Technology:** Browser localStorage, service worker cache
- **Features:** Offline capability, fast access

## Architecture Patterns

### Microservices Architecture
- **API Gateway:** Cloudflare Worker as entry point
- **Service Separation:** ML, WebSocket, and static services
- **Communication:** REST APIs and WebSocket protocols

### Edge Computing
- **Global Distribution:** Cloudflare Edge network
- **Low Latency:** Processing at edge locations
- **High Availability:** Multi-region deployment

### Event-Driven Architecture
- **Real-time Updates:** WebSocket connections
- **Asynchronous Processing:** Background ML analysis
- **Event Streaming:** Health data flow processing

## Security Architecture

### Authentication
- **JWT Tokens:** Secure device authentication
- **Token Validation:** Server-side verification
- **Session Management:** Secure token storage

### Data Protection
- **Encryption:** Data at rest and in transit
- **HTTPS:** End-to-end encryption
- **CORS:** Proper cross-origin configuration

### Access Control
- **Rate Limiting:** API endpoint protection
- **Input Validation:** All data inputs validated
- **Error Handling:** Secure error responses

## Performance Architecture

### Caching Strategy
- **CDN Caching:** Static assets cached globally
- **API Caching:** Intelligent response caching
- **Browser Caching:** Client-side caching optimized

### Optimization Techniques
- **Code Splitting:** Lazy loading of components
- **Bundle Optimization:** Minimized asset sizes
- **Resource Compression:** Gzip/Brotli compression

## Deployment Architecture

### Multi-Environment Setup
- **Development:** Local development with hot reload
- **Staging:** Pre-production testing environment
- **Production:** Global edge deployment

### CI/CD Pipeline
- **Source Control:** Git-based workflow
- **Automated Testing:** Unit, integration, and E2E tests
- **Deployment:** Automated Cloudflare Workers deployment

## Monitoring and Observability

### Metrics Collection
- **Performance Metrics:** Response times, error rates
- **Business Metrics:** User engagement, health insights
- **System Metrics:** Resource usage, scaling events

### Logging Strategy
- **Structured Logging:** JSON format for analysis
- **Log Aggregation:** Centralized log collection
- **Alert Management:** Automated incident detection

## Scalability Design

### Horizontal Scaling
- **Worker Scaling:** Automatic based on demand
- **Global Distribution:** Edge location deployment
- **Load Balancing:** Automatic traffic distribution

### Vertical Optimization
- **Code Efficiency:** Optimized algorithms
- **Memory Management:** Efficient data structures
- **CPU Optimization:** Performance-critical paths

## Future Architecture Considerations
- **AI/ML Enhancement:** Advanced prediction models
- **IoT Integration:** Direct device connectivity
- **Mobile Applications:** Native iOS/Android apps
- **Third-party Integrations:** Health platform APIs
`;

    const archDocPath = path.join(
      this.workspaceRoot,
      'docs',
      'SYSTEM_ARCHITECTURE.md'
    );
    await fs.writeFile(archDocPath, architectureDoc);

    this.docsGenerated.push({
      type: 'System Architecture',
      path: archDocPath,
      size: architectureDoc.length,
    });

    this.log(
      'success',
      `Architecture documentation generated: ${archDocPath}`,
      'ARCH'
    );
    return architectureDoc;
  }

  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async generateSummaryReport() {
    this.log('docs', 'Generating documentation summary report...', 'SUMMARY');

    const report = {
      timestamp: new Date().toISOString(),
      task: 'Production Documentation Generation',
      documentsGenerated: this.docsGenerated.length,
      deploymentGuides: this.deploymentGuides.length,
      totalSize: [...this.docsGenerated, ...this.deploymentGuides].reduce(
        (sum, doc) => sum + doc.size,
        0
      ),
      documents: [...this.docsGenerated, ...this.deploymentGuides],
      coverage: {
        api: 'Complete API documentation with examples',
        deployment: 'Step-by-step production deployment guide',
        operations: 'Comprehensive operational procedures',
        architecture: 'Detailed system architecture overview',
      },
      nextSteps: [
        'Review generated documentation for accuracy',
        'Add project-specific customizations',
        'Distribute to team members',
        'Schedule regular documentation updates',
      ],
    };

    const reportPath = path.join(
      this.workspaceRoot,
      'production-documentation-report.json'
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    this.log('success', `Summary report saved: ${reportPath}`, 'SUMMARY');
    return report;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📚 PRODUCTION DOCUMENTATION SUMMARY');
    console.log('='.repeat(60));

    console.log(
      `📋 Documents Generated: ${this.docsGenerated.length + this.deploymentGuides.length}`
    );

    [...this.docsGenerated, ...this.deploymentGuides].forEach((doc) => {
      console.log(
        `  📄 ${doc.type}: ${path.basename(doc.path)} (${doc.size} bytes)`
      );
    });

    const totalSize = [...this.docsGenerated, ...this.deploymentGuides].reduce(
      (sum, doc) => sum + doc.size,
      0
    );
    console.log(
      `\n📊 Total Documentation: ${totalSize.toLocaleString()} bytes`
    );

    console.log('\n📚 Documentation Coverage:');
    console.log('  ✅ API Documentation - Complete with examples');
    console.log('  ✅ Deployment Guide - Step-by-step production setup');
    console.log('  ✅ Operational Procedures - Day-to-day operations');
    console.log('  ✅ System Architecture - Technical overview');

    console.log('\n🎯 Documentation Quality: COMPREHENSIVE');
    console.log('Ready for production deployment and team distribution');
  }

  async run() {
    console.log('📚 VITALSENSE PRODUCTION DOCUMENTATION GENERATOR');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log('🎯 Task 3: Generate comprehensive production documentation');
    console.log();

    try {
      // Generate all documentation
      await this.generateAPIDocumentation();
      await this.generateDeploymentGuide();
      await this.generateOperationalGuide();
      await this.generateArchitectureDoc();

      // Generate summary report
      const report = await this.generateSummaryReport();

      // Print summary
      this.printSummary();

      console.log('\n🎯 NEXT STEP: Run final system validation');
      console.log('Run: node scripts/task4-final-validation.js');

      return {
        success: true,
        documentsGenerated:
          this.docsGenerated.length + this.deploymentGuides.length,
        report,
      };
    } catch (error) {
      this.log('error', `Documentation generation failed: ${error.message}`);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new ProductionDocumentationGenerator();
  generator
    .run()
    .then(() => {
      console.log('\n✅ Task 3: Production documentation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Task 3 failed:', error.message);
      process.exit(1);
    });
}

export default ProductionDocumentationGenerator;
