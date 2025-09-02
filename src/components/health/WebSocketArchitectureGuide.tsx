import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  CloudUpload,
  Code,
  Database,
  Shield,
  Terminal,
  Settings,
  Network,
  Key,
  Bug,
  FlaskConical,
  Smartphone,
  Globe,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Timer,
  Lock,
  Eye,
} from 'lucide-react';

interface WebSocketComponent {
  id: string;
  title: string;
  description: string;
  category:
    | 'backend'
    | 'ios'
    | 'web'
    | 'security'
    | 'deployment'
    | 'monitoring';
  language: 'Swift' | 'TypeScript' | 'JavaScript' | 'Docker' | 'Config';
  estimatedHours: number;
  complexity: 'basic' | 'intermediate' | 'advanced';
  completed: boolean;
  codeExample?: string;
  documentation?: string;
  notes?: string[];
}

export default function WebSocketArchitectureGuide() {
  const [components, setComponents] = useKV<WebSocketComponent[]>(
    'websocket-components',
    [
      // Backend Infrastructure
      {
        id: 'websocket-server',
        title: 'WebSocket Server Setup',
        description:
          'Node.js WebSocket server with authentication and health data routing',
        category: 'backend',
        language: 'TypeScript',
        estimatedHours: 8,
        complexity: 'intermediate',
        completed: false,
        codeExample: `// server.ts
import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import express from 'express'
import https from 'https'

interface HealthDataMessage {
  type: 'health_data' | 'fall_alert' | 'heartbeat'
  userId: string
  timestamp: string
  data: any
  deviceId: string
}

class HealthWebSocketServer {
  private wss: WebSocketServer
  private app: express.Application
  private clients: Map<string, Set<WebSocket>> = new Map()

  constructor() {
    this.app = express()
    this.setupRoutes()
    
    const server = https.createServer({
      // SSL certificates for secure WebSocket
    }, this.app)

    this.wss = new WebSocketServer({ 
      server,
      verifyClient: this.verifyClient.bind(this)
    })
    
    this.wss.on('connection', this.handleConnection.bind(this))
  }

  private verifyClient(info: any): boolean {
    const token = info.req.url.split('token=')[1]
    try {
      jwt.verify(token, process.env.JWT_SECRET!)
      return true
    } catch {
      return false
    }
  }

  private handleConnection(ws: WebSocket, req: any) {
    const token = req.url.split('token=')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Add client to user's connection set
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set())
    }
    this.clients.get(userId)!.add(ws)

    ws.on('message', (data) => {
      this.handleMessage(userId, data)
    })

    ws.on('close', () => {
      this.clients.get(userId)?.delete(ws)
    })
  }

  private handleMessage(userId: string, data: Buffer) {
    try {
      const message: HealthDataMessage = JSON.parse(data.toString())
      
      // Process different message types
      switch (message.type) {
        case 'health_data':
          this.processHealthData(userId, message)
          break
        case 'fall_alert':
          this.handleFallAlert(userId, message)
          break
        case 'heartbeat':
          this.handleHeartbeat(userId, message)
          break
      }
    } catch (error) {
      console.error('Message processing error:', error)
    }
  }

  private processHealthData(userId: string, message: HealthDataMessage) {
    // Store in database
    // Broadcast to connected web clients
    this.broadcastToUser(userId, {
      type: 'health_update',
      data: message.data,
      timestamp: message.timestamp
    })
  }

  private handleFallAlert(userId: string, message: HealthDataMessage) {
    // Immediate emergency response
    this.broadcastToUser(userId, {
      type: 'emergency_alert',
      data: message.data,
      timestamp: message.timestamp,
      priority: 'critical'
    })
    
    // Trigger external emergency services if configured
  }

  private broadcastToUser(userId: string, message: any) {
    const userClients = this.clients.get(userId)
    if (userClients) {
      const messageStr = JSON.stringify(message)
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr)
        }
      })
    }
  }
}`,
        notes: [
          'Use secure WebSocket (WSS) for production',
          'Implement proper authentication with JWT tokens',
          'Handle client reconnection gracefully',
          'Rate limiting to prevent abuse',
        ],
      },
      {
        id: 'data-persistence',
        title: 'Health Data Persistence Layer',
        description:
          'Database design and APIs for storing real-time health data',
        category: 'backend',
        language: 'TypeScript',
        estimatedHours: 6,
        complexity: 'intermediate',
        completed: false,
        codeExample: `// healthDataService.ts
import { PrismaClient } from '@prisma/client'

interface HealthMetrics {
  stepCount?: number
  heartRate?: number
  walkingSpeed?: number
  walkingSteadiness?: number
  fallRiskScore?: number
  timestamp: Date
}

class HealthDataService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async storeHealthData(userId: string, metrics: HealthMetrics, deviceId: string) {
    try {
      const healthRecord = await this.prisma.healthData.create({
        data: {
          userId,
          deviceId,
          stepCount: metrics.stepCount,
          heartRate: metrics.heartRate,
          walkingSpeed: metrics.walkingSpeed,
          walkingSteadiness: metrics.walkingSteadiness,
          fallRiskScore: metrics.fallRiskScore,
          timestamp: metrics.timestamp,
          createdAt: new Date()
        }
      })

      // Trigger real-time analytics
      await this.updateRealTimeAnalytics(userId, metrics)
      
      return healthRecord
    } catch (error) {
      console.error('Health data storage error:', error)
      throw error
    }
  }

  async getRecentHealthData(userId: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    return await this.prisma.healthData.findMany({
      where: {
        userId,
        timestamp: { gte: since }
      },
      orderBy: { timestamp: 'desc' }
    })
  }

  private async updateRealTimeAnalytics(userId: string, metrics: HealthMetrics) {
    // Calculate trend analysis
    // Update fall risk assessment
    // Trigger alerts if thresholds exceeded
  }
}`,
        notes: [
          'Use time-series database for optimal performance',
          'Implement data retention policies',
          'Consider HIPAA compliance for health data',
          'Index on userId and timestamp for fast queries',
        ],
      },

      // iOS Client Implementation
      {
        id: 'ios-websocket-client',
        title: 'iOS WebSocket Client',
        description:
          'Native iOS WebSocket client for real-time health data streaming',
        category: 'ios',
        language: 'Swift',
        estimatedHours: 10,
        complexity: 'advanced',
        completed: false,
        codeExample: `// HealthWebSocketManager.swift
import Foundation
import HealthKit
import Network

class HealthWebSocketManager: ObservableObject {
    private var webSocketTask: URLSessionWebSocketTask?
    private let urlSession = URLSession(configuration: .default)
    private let healthStore = HKHealthStore()
    private var reconnectionTimer: Timer?
    
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var lastDataSent: Date?
    
    enum ConnectionStatus {
        case connected, disconnected, connecting, error
    }
    
    struct HealthDataPayload: Codable {
        let type: String = "health_data"
        let userId: String
        let timestamp: String
        let deviceId: String
        let data: HealthMetrics
    }
    
    struct HealthMetrics: Codable {
        let stepCount: Int?
        let heartRate: Double?
        let walkingSpeed: Double?
        let walkingSteadiness: Double?
        let fallRiskScore: Double?
    }
    
    func connect(userId: String, authToken: String) {
        guard let url = URL(string: "wss://your-server.com/health?token=\\(authToken)") else {
            return
        }
        
        connectionStatus = .connecting
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        
        setupConnectionMonitoring()
        startListeningForMessages()
        startHealthDataStreaming(userId: userId)
    }
    
    private func setupConnectionMonitoring() {
        // Monitor connection state
        // Implement exponential backoff for reconnection
        reconnectionTimer = Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { _ in
            self.sendHeartbeat()
        }
    }
    
    private func startHealthDataStreaming(userId: String) {
        // Set up HealthKit observers for real-time data
        let stepType = HKObjectType.quantityType(forIdentifier: .stepCount)!
        
        let query = HKObserverQuery(sampleType: stepType, predicate: nil) { _, _, error in
            if error == nil {
                self.fetchAndSendLatestHealthData(userId: userId)
            }
        }
        
        healthStore.execute(query)
        healthStore.enableBackgroundDelivery(for: stepType, frequency: .immediate) { _, _ in }
    }
    
    private func fetchAndSendLatestHealthData(userId: String) {
        // Fetch latest health metrics
        // Package into HealthDataPayload
        // Send via WebSocket
        
        let payload = HealthDataPayload(
            userId: userId,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
            data: HealthMetrics(
                stepCount: 8500,  // Fetch from HealthKit
                heartRate: 72.0,
                walkingSpeed: 1.2,
                walkingSteadiness: 85.0,
                fallRiskScore: 25.0
            )
        )
        
        sendHealthData(payload)
    }
    
    private func sendHealthData(_ payload: HealthDataPayload) {
        guard let webSocketTask = webSocketTask,
              webSocketTask.state == .running else {
            // Queue data for later sending
            return
        }
        
        do {
            let jsonData = try JSONEncoder().encode(payload)
            let message = URLSessionWebSocketTask.Message.data(jsonData)
            
            webSocketTask.send(message) { [weak self] error in
                DispatchQueue.main.async {
                    if error == nil {
                        self?.lastDataSent = Date()
                        self?.connectionStatus = .connected
                    } else {
                        self?.connectionStatus = .error
                        self?.attemptReconnection()
                    }
                }
            }
        } catch {
            print("JSON encoding error: \\(error)")
        }
    }
    
    private func sendHeartbeat() {
        // Send periodic heartbeat to maintain connection
    }
    
    private func attemptReconnection() {
        // Implement exponential backoff reconnection logic
    }
    
    func sendFallAlert(location: CLLocation?, severity: FallSeverity) {
        let alert = FallAlertPayload(
            type: "fall_alert",
            userId: currentUserId,
            timestamp: ISO8601DateFormatter().string(from: Date()),
            deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
            location: location,
            severity: severity
        )
        
        // Send with high priority
        sendFallAlert(alert)
    }
}`,
        notes: [
          'Implement robust reconnection logic',
          'Handle background app states properly',
          'Queue data when connection is unavailable',
          'Optimize for battery usage',
        ],
      },

      // Web Client Implementation
      {
        id: 'web-client-integration',
        title: 'Web Application WebSocket Client',
        description:
          'JavaScript/TypeScript client for receiving real-time health updates',
        category: 'web',
        language: 'TypeScript',
        estimatedHours: 6,
        complexity: 'intermediate',
        completed: false,
        codeExample: `// healthWebSocketClient.ts
interface HealthDataUpdate {
  type: 'health_update' | 'emergency_alert' | 'connection_status'
  data: any
  timestamp: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

class HealthWebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private userId: string
  private authToken: string
  
  constructor(userId: string, authToken: string) {
    this.userId = userId
    this.authToken = authToken
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = \`wss://your-server.com/health?token=\${this.authToken}\`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = (event) => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.handleReconnection()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleMessage(data: string) {
    try {
      const update: HealthDataUpdate = JSON.parse(data)
      
      switch (update.type) {
        case 'health_update':
          this.onHealthDataUpdate(update.data)
          break
        case 'emergency_alert':
          this.onEmergencyAlert(update.data)
          break
        case 'connection_status':
          this.onConnectionStatus(update.data)
          break
      }
    } catch (error) {
      console.error('Message parsing error:', error)
    }
  }

  private onHealthDataUpdate(data: any) {
    // Update the health dashboard in real-time
    // Trigger UI updates
    // Store in local state management (Redux/Zustand)
    
    window.dispatchEvent(new CustomEvent('healthDataUpdate', {
      detail: { data, timestamp: new Date() }
    }))
  }

  private onEmergencyAlert(data: any) {
    // Show urgent notification
    // Play alert sound
    // Update emergency dashboard
    
    if (Notification.permission === 'granted') {
      new Notification('Emergency Alert', {
        body: 'Fall detected - Emergency response activated',
        icon: '/emergency-icon.png',
        tag: 'emergency',
        requireInteraction: true
      })
    }
    
    window.dispatchEvent(new CustomEvent('emergencyAlert', {
      detail: { data, timestamp: new Date() }
    }))
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        console.log(\`Reconnection attempt \${this.reconnectAttempts}\`)
        this.connect()
      }, delay)
    }
  }

  public requestHistoricalData(hours: number = 24) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'request_historical_data',
        userId: this.userId,
        hours: hours
      }))
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// React Hook for WebSocket integration
export function useHealthWebSocket(userId: string, authToken: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [client, setClient] = useState<HealthWebSocketClient | null>(null)

  useEffect(() => {
    const wsClient = new HealthWebSocketClient(userId, authToken)
    setClient(wsClient)

    wsClient.connect()
      .then(() => setIsConnected(true))
      .catch(error => console.error('WebSocket connection failed:', error))

    // Listen for health data updates
    const handleHealthUpdate = (event: CustomEvent) => {
      setLastUpdate(event.detail.timestamp)
    }

    window.addEventListener('healthDataUpdate', handleHealthUpdate as EventListener)

    return () => {
      wsClient.disconnect()
      window.removeEventListener('healthDataUpdate', handleHealthUpdate as EventListener)
    }
  }, [userId, authToken])

  return { isConnected, lastUpdate, client }
}`,
        notes: [
          'Implement proper error boundaries',
          'Handle browser tab visibility changes',
          'Use service workers for background updates',
          'Implement offline data queuing',
        ],
      },

      // Security Components
      {
        id: 'authentication-system',
        title: 'WebSocket Authentication & Authorization',
        description: 'Secure authentication system for WebSocket connections',
        category: 'security',
        language: 'TypeScript',
        estimatedHours: 8,
        complexity: 'advanced',
        completed: false,
        codeExample: `// authenticationService.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'

interface UserSession {
  userId: string
  deviceId: string
  lastActivity: Date
  permissions: string[]
}

class WebSocketAuthService {
  private activeSessions: Map<string, UserSession> = new Map()
  
  // Rate limiting for auth attempts
  private authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts'
  })

  async authenticateUser(username: string, password: string, deviceId: string): Promise<string | null> {
    try {
      // Verify user credentials
      const user = await this.getUserByUsername(username)
      if (!user || !await bcrypt.compare(password, user.passwordHash)) {
        return null
      }

      // Generate JWT token with health data permissions
      const token = jwt.sign(
        { 
          userId: user.id,
          deviceId,
          permissions: ['health:read', 'health:write', 'emergency:alert'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        process.env.JWT_SECRET!,
        { algorithm: 'HS256' }
      )

      // Store active session
      this.activeSessions.set(token, {
        userId: user.id,
        deviceId,
        lastActivity: new Date(),
        permissions: ['health:read', 'health:write', 'emergency:alert']
      })

      return token
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  validateWebSocketConnection(token: string): boolean {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const session = this.activeSessions.get(token)
      
      if (!session) {
        return false
      }

      // Update last activity
      session.lastActivity = new Date()
      
      return true
    } catch (error) {
      console.error('Token validation error:', error)
      return false
    }
  }

  hasPermission(token: string, permission: string): boolean {
    const session = this.activeSessions.get(token)
    return session?.permissions.includes(permission) || false
  }

  revokeSession(token: string) {
    this.activeSessions.delete(token)
  }

  // Clean up expired sessions
  private cleanupExpiredSessions() {
    const now = new Date()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours

    for (const [token, session] of this.activeSessions) {
      if (now.getTime() - session.lastActivity.getTime() > maxAge) {
        this.activeSessions.delete(token)
      }
    }
  }
}`,
        notes: [
          'Use strong JWT secrets and rotate regularly',
          'Implement session management and cleanup',
          'Add rate limiting to prevent brute force attacks',
          'Consider OAuth2 for third-party integrations',
        ],
      },

      // Deployment & Monitoring
      {
        id: 'docker-deployment',
        title: 'Production Docker Deployment',
        description: 'Containerized deployment with load balancing and scaling',
        category: 'deployment',
        language: 'Docker',
        estimatedHours: 6,
        complexity: 'intermediate',
        completed: false,
        codeExample: `# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY certs/ ./certs/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S healthapp -u 1001
USER healthapp

EXPOSE 3000
EXPOSE 8080

CMD ["node", "dist/server.js"]

---

# docker-compose.yml
version: '3.8'

services:
  health-websocket:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=\${JWT_SECRET}
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    volumes:
      - ./certs:/app/certs:ro
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: vitalsense
      POSTGRES_USER: healthapp
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - health-websocket
    restart: unless-stopped

volumes:
  postgres_data:`,
        notes: [
          'Use SSL/TLS certificates for production',
          'Implement health checks for containers',
          'Set up log aggregation and monitoring',
          'Configure auto-scaling based on connection count',
        ],
      },

      // Monitoring & Analytics
      {
        id: 'monitoring-system',
        title: 'Real-time Monitoring & Analytics',
        description:
          'System monitoring, performance metrics, and health data analytics',
        category: 'monitoring',
        language: 'TypeScript',
        estimatedHours: 10,
        complexity: 'advanced',
        completed: false,
        codeExample: `// monitoringService.ts
import { EventEmitter } from 'events'

interface SystemMetrics {
  activeConnections: number
  messagesPerSecond: number
  averageLatency: number
  errorRate: number
  memoryUsage: number
  cpuUsage: number
}

interface HealthAnalytics {
  totalUsers: number
  activeUsers: number
  fallAlertsToday: number
  averageHealthScore: number
  criticalAlerts: number
}

class HealthMonitoringService extends EventEmitter {
  private metrics: SystemMetrics = {
    activeConnections: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  }

  private analytics: HealthAnalytics = {
    totalUsers: 0,
    activeUsers: 0,
    fallAlertsToday: 0,
    averageHealthScore: 0,
    criticalAlerts: 0
  }

  constructor() {
    super()
    this.startMetricsCollection()
  }

  private startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Collect health analytics every 5 minutes
    setInterval(() => {
      this.collectHealthAnalytics()
    }, 300000)
  }

  private async collectSystemMetrics() {
    // Monitor WebSocket connections
    // Track message throughput
    // Measure response times
    // Check error rates
    
    const memUsage = process.memoryUsage()
    this.metrics.memoryUsage = memUsage.heapUsed / 1024 / 1024 // MB

    // Emit metrics for dashboard
    this.emit('systemMetrics', this.metrics)

    // Check for alerts
    this.checkSystemAlerts()
  }

  private async collectHealthAnalytics() {
    // Query database for health data trends
    // Calculate aggregate statistics
    // Identify patterns and anomalies
    
    this.emit('healthAnalytics', this.analytics)
  }

  private checkSystemAlerts() {
    // High connection count
    if (this.metrics.activeConnections > 10000) {
      this.emit('alert', {
        type: 'high_load',
        message: 'High connection count detected',
        severity: 'AlertTriangle'
      })
    }

    // High error rate
    if (this.metrics.errorRate > 0.05) {
      this.emit('alert', {
        type: 'high_error_rate',
        message: 'Error rate above 5%',
        severity: 'critical'
      })
    }

    // High memory usage
    if (this.metrics.memoryUsage > 1000) {
      this.emit('alert', {
        type: 'high_memory',
        message: 'Memory usage above 1GB',
        severity: 'AlertTriangle'
      })
    }
  }

  recordMessage(latency: number, success: boolean) {
    // Update message throughput and latency metrics
    if (!success) {
      // Update error rate
    }
  }

  recordFallAlert(userId: string, severity: string) {
    this.analytics.fallAlertsToday++
    if (severity === 'critical') {
      this.analytics.criticalAlerts++
    }

    this.emit('fallAlert', { userId, severity, timestamp: new Date() })
  }

  getSystemHealth(): 'healthy' | 'degraded' | 'critical' {
    if (this.metrics.errorRate > 0.1 || this.metrics.averageLatency > 5000) {
      return 'critical'
    }
    if (this.metrics.errorRate > 0.05 || this.metrics.averageLatency > 2000) {
      return 'degraded'
    }
    return 'healthy'
  }
}`,
        notes: [
          'Integrate with monitoring tools like Grafana/Prometheus',
          'Set up alerting for critical system events',
          'Track health data trends and patterns',
          'Monitor fall detection accuracy metrics',
        ],
      },
    ]
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleComponent = (componentId: string) => {
    setComponents((currentComponents) =>
      currentComponents.map((comp) =>
        comp.id === componentId ? { ...comp, completed: !comp.completed } : comp
      )
    );
  };

  const getComponentsByCategory = (category: string) => {
    if (category === 'all') return components;
    return components.filter((comp) => comp.category === category);
  };

  const calculateProgress = (category?: string) => {
    const relevantComponents = category
      ? components.filter((c) => c.category === category)
      : components;
    const completedComponents = relevantComponents.filter(
      (c) => c.completed
    ).length;
    return Math.round((completedComponents / relevantComponents.length) * 100);
  };

  const getTotalHours = (category?: string) => {
    const relevantComponents = category
      ? components.filter((c) => c.category === category)
      : components;
    return relevantComponents.reduce(
      (total, comp) => total + comp.estimatedHours,
      0
    );
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'Swift':
        return 'bg-orange-500';
      case 'TypeScript':
        return 'bg-blue-500';
      case 'JavaScript':
        return 'bg-yellow-500';
      case 'Docker':
        return 'bg-blue-600';
      case 'Config':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const categories = [
    {
      id: 'all',
      label: 'All Components',
      icon: <Network className="h-4 w-4" />,
    },
    { id: 'backend', label: 'Backend', icon: <Database className="h-4 w-4" /> },
    {
      id: 'ios',
      label: 'iOS Client',
      icon: <Smartphone className="h-4 w-4" />,
    },
    { id: 'web', label: 'Web Client', icon: <Globe className="h-4 w-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
    {
      id: 'deployment',
      label: 'Deployment',
      icon: <CloudUpload className="h-4 w-4" />,
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: <Eye className="h-4 w-4" />,
    },
  ];

  const overallProgress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="h-6 w-6" />
            WebSocket Bridge Architecture Guide
          </CardTitle>
          <CardDescription>
            Complete real-time health data streaming architecture between iOS
            app and web application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-primary text-2xl font-bold">
                {overallProgress}%
              </div>
              <div className="text-muted-foreground text-sm">
                Implementation Progress
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{getTotalHours()}h</div>
              <div className="text-muted-foreground text-sm">
                Total Development Time
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{components.length}</div>
              <div className="text-muted-foreground text-sm">
                Total Components
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {components.filter((c) => c.complexity === 'advanced').length}
              </div>
              <div className="text-muted-foreground text-sm">
                Advanced Components
              </div>
            </div>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </CardContent>
      </Card>

      {/* Architecture Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-6 w-6" />
            System Architecture Overview
          </CardTitle>
          <CardDescription>
            Real-time health data flow from Apple Watch to web dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Architecture Diagram */}
            <div className="bg-muted rounded-lg p-6">
              <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-4">
                <div className="space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-medium">Apple Watch</h4>
                  <p className="text-muted-foreground text-xs">
                    Health sensors & fall detection
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-medium">iOS App</h4>
                  <p className="text-muted-foreground text-xs">
                    HealthKit integration & WebSocket client
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
                    <CloudUpload className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-medium">WebSocket Server</h4>
                  <p className="text-muted-foreground text-xs">
                    Real-time data routing & storage
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="font-medium">Web Dashboard</h4>
                  <p className="text-muted-foreground text-xs">
                    Real-time health monitoring
                  </p>
                </div>
              </div>
            </div>

            {/* Data Flow */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Flow:</strong> Apple Watch sensors → HealthKit →
                iOS App → WebSocket Bridge → Web Dashboard. Fall detection
                triggers immediate emergency alerts across all connected
                devices.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Components */}
      <Tabs
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-7">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="flex items-center gap-1 text-xs"
            >
              {category.icon}
              <span className="hidden sm:inline">
                {category.label.split(' ')[0]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category.id}
            value={category.id}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{category.label}</h3>
              <div className="flex items-center gap-4">
                <Badge variant="outline">
                  {
                    getComponentsByCategory(category.id).filter(
                      (c) => c.completed
                    ).length
                  }{' '}
                  / {getComponentsByCategory(category.id).length} completed
                </Badge>
                <Badge variant="secondary">
                  {getTotalHours(
                    category.id === 'all' ? undefined : category.id
                  )}
                  h estimated
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {getComponentsByCategory(category.id).map((component) => (
                <Card
                  key={component.id}
                  className={component.completed ? 'opacity-75' : ''}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={component.completed}
                            onChange={() => toggleComponent(component.id)}
                            className="text-primary h-4 w-4"
                          />
                          <h4
                            className={`font-medium ${component.completed ? 'text-muted-foreground line-through' : ''}`}
                          >
                            {component.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${getLanguageColor(component.language)}`}
                          />
                          <span className="text-muted-foreground text-xs">
                            {component.language}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {component.estimatedHours}h
                          </span>
                          <span
                            className={`text-xs font-medium ${getComplexityColor(component.complexity)}`}
                          >
                            {component.complexity}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm">
                        {component.description}
                      </p>

                      {component.codeExample && (
                        <div className="space-y-2">
                          <h5 className="flex items-center gap-2 text-sm font-medium">
                            <Code className="h-4 w-4" />
                            Implementation Example:
                          </h5>
                          <div className="bg-muted max-h-96 overflow-x-auto rounded-lg p-4 font-mono text-xs">
                            <pre>{component.codeExample}</pre>
                          </div>
                        </div>
                      )}

                      {component.notes && component.notes.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="flex items-center gap-2 text-sm font-medium">
                            <Lightbulb className="h-4 w-4" />
                            Implementation Notes:
                          </h5>
                          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                            {component.notes.map((note, index) => (
                              <li key={index}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {component.documentation && (
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          <a
                            href={component.documentation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            Technical Documentation
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Security & Compliance Considerations
          </CardTitle>
          <CardDescription>
            Critical security measures for health data protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Data Protection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>End-to-end encryption (AES-256)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>TLS 1.3 for WebSocket connections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>JWT token authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <span>Rate limiting and DDoS protection</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Compliance</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span>HIPAA compliance for health data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span>GDPR data protection requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span>Apple Health data usage policies</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="h-3 w-3" />
                  <span>Data retention and deletion policies</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Health data requires special handling.
              Ensure proper encryption, access controls, and compliance with
              healthcare regulations before deploying to production.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
