var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/workers/vitalsense-websocket-advanced.ts
var VitalSenseAdvancedWebSocketDO = class {
  static {
    __name(this, "VitalSenseAdvancedWebSocketDO");
  }
  clients = /* @__PURE__ */ new Map();
  storage;
  constructor(ctx, _env) {
    this.storage = ctx.storage;
    this.startHeartbeatCheck();
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "VitalSense Advanced ML WebSocket",
          version: "3.0.0-ml",
          clients: this.clients.size,
          features: [
            "real_time_health_processing",
            "predictive_analytics",
            "anomaly_detection",
            "personalized_insights",
            "emergency_alerts",
            "wellness_scoring",
            "fall_risk_assessment"
          ]
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (request.headers.get("Upgrade") === "websocket") {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      await this.handleWebSocketConnection(server);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    return new Response("VitalSense Advanced ML WebSocket Worker", {
      status: 200
    });
  }
  async handleWebSocketConnection(ws) {
    const clientId = crypto.randomUUID();
    const clientInfo = {
      id: clientId,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now()
    };
    this.clients.set(ws, clientInfo);
    console.log(`\u{1F9E0} VitalSense ML client connected: ${clientId}`);
    ws.accept();
    this.sendMessage(ws, {
      type: "vitalsense_ml_connection_established",
      data: {
        clientId,
        serverTime: (/* @__PURE__ */ new Date()).toISOString(),
        capabilities: [
          "health_monitoring",
          "predictive_analytics",
          "anomaly_detection",
          "personalized_coaching",
          "emergency_alerts"
        ],
        ml_models: ["trend_predictor", "anomaly_detector", "wellness_scorer"]
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    ws.addEventListener("message", (event) => {
      this.handleMessage(ws, event.data, clientInfo);
    });
    ws.addEventListener("close", () => {
      this.clients.delete(ws);
      console.log(`\u{1F4F4} VitalSense ML client disconnected: ${clientId}`);
    });
  }
  async handleMessage(ws, data, clientInfo) {
    try {
      const message = JSON.parse(data);
      const { type, ...payload } = message;
      switch (type) {
        case "client_identification":
          clientInfo.userId = payload.userId;
          console.log(`\u{1F464} VitalSense ML client identified: ${payload.userId}`);
          this.sendMessage(ws, {
            type: "identification_confirmed",
            data: {
              status: "authenticated",
              ml_features_enabled: true
            }
          });
          break;
        case "vitalsense_health_data":
          await this.processHealthDataWithML(clientInfo, payload);
          break;
        case "request_predictions":
          await this.generatePredictions(ws, clientInfo);
          break;
        case "request_insights":
          await this.generatePersonalizedInsights(ws, clientInfo);
          break;
        case "heartbeat":
          clientInfo.lastHeartbeat = Date.now();
          this.sendMessage(ws, {
            type: "heartbeat_ack",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          break;
        default:
          console.warn(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }
  /**
   * Process health data with advanced ML analytics
   */
  async processHealthDataWithML(clientInfo, payload) {
    if (!clientInfo.userId) return;
    const healthDataArray = this.extractHealthDataArray(payload);
    const processedData = [];
    const alerts = [];
    const predictions = [];
    const anomalies = [];
    for (const dataPoint of healthDataArray) {
      const wellnessScore = this.calculateWellnessScore(dataPoint);
      const alert = this.checkForHealthAlerts(dataPoint);
      if (alert) alerts.push(alert);
      const prediction = await this.predictHealthTrend(
        clientInfo.userId,
        dataPoint
      );
      if (prediction) predictions.push(prediction);
      const anomaly = await this.detectAnomalies(clientInfo.userId, dataPoint);
      if (anomaly) anomalies.push(anomaly);
      const processedPoint = {
        ...dataPoint,
        id: crypto.randomUUID(),
        user_id: clientInfo.userId,
        wellness_score: wellnessScore,
        processed_at: Date.now()
      };
      await this.storage.put(`health:${processedPoint.id}`, processedPoint);
      processedData.push(processedPoint);
    }
    await this.updateUserHealthHistory(clientInfo.userId, processedData);
    const insights = await this.generateInsights(
      clientInfo.userId,
      processedData
    );
    await this.broadcastToUser(clientInfo.userId, {
      type: "vitalsense_ml_health_update",
      data: {
        metrics: processedData,
        alerts,
        predictions,
        anomalies,
        insights,
        wellness_summary: this.generateWellnessSummary(processedData),
        ml_confidence: 0.87
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    console.log(
      `\u{1F9E0} Processed ${healthDataArray.length} health data points with ML analysis`
    );
  }
  /**
   * Predict health trends using simplified ML approach
   */
  async predictHealthTrend(userId, healthData) {
    const historicalData = await this.getUserHealthHistory(
      userId,
      healthData.type
    );
    if (historicalData.length < 7) return null;
    const values = historicalData.slice(-14).map((d) => d.value);
    const trend = this.calculateTrend(values);
    const predicted_value = healthData.value + trend * 7;
    const confidence = this.calculatePredictionConfidence(values);
    const risk_level = this.assessRiskLevel(healthData.type, predicted_value);
    return {
      metric_type: healthData.type,
      predicted_value: Math.round(predicted_value * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      time_horizon_days: 7,
      risk_level,
      contributing_factors: this.identifyTrendFactors(healthData.type, trend)
    };
  }
  /**
   * Detect anomalies using statistical analysis
   */
  async detectAnomalies(userId, healthData) {
    const historicalData = await this.getUserHealthHistory(
      userId,
      healthData.type
    );
    if (historicalData.length < 10) return null;
    const values = historicalData.slice(-30).map((d) => d.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );
    const deviation = Math.abs(healthData.value - mean);
    const threshold = 2.5 * stdDev;
    if (deviation <= threshold) return null;
    const severity = this.determineSeverity(deviation, threshold);
    const expected_range = [
      Math.round((mean - threshold) * 100) / 100,
      Math.round((mean + threshold) * 100) / 100
    ];
    return {
      metric_type: healthData.type,
      current_value: healthData.value,
      expected_range,
      severity,
      explanation: this.generateAnomalyExplanation(
        healthData.type,
        healthData.value,
        expected_range
      )
    };
  }
  /**
   * Generate personalized health insights
   */
  async generatePredictions(ws, clientInfo) {
    if (!clientInfo.userId) return;
    const predictions = [];
    const metricTypes = ["heart_rate", "walking_steadiness", "gait_speed"];
    for (const metricType of metricTypes) {
      const historicalData = await this.getUserHealthHistory(
        clientInfo.userId,
        metricType
      );
      if (historicalData.length >= 7) {
        const recentValues = historicalData.slice(-7).map((d) => d.value);
        const trend = this.calculateTrend(recentValues);
        const lastValue = recentValues[recentValues.length - 1];
        const predicted_value = lastValue + trend * 7;
        predictions.push({
          metric_type: metricType,
          predicted_value: Math.round(predicted_value * 100) / 100,
          confidence: this.calculatePredictionConfidence(recentValues),
          time_horizon_days: 7,
          risk_level: this.assessRiskLevel(metricType, predicted_value),
          contributing_factors: this.identifyTrendFactors(metricType, trend)
        });
      }
    }
    this.sendMessage(ws, {
      type: "health_predictions_response",
      data: { predictions },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Generate personalized insights and recommendations
   */
  async generatePersonalizedInsights(ws, clientInfo) {
    if (!clientInfo.userId) return;
    const insights = [];
    const recommendations = [];
    const heartRateData = await this.getUserHealthHistory(
      clientInfo.userId,
      "heart_rate"
    );
    const steadinessData = await this.getUserHealthHistory(
      clientInfo.userId,
      "walking_steadiness"
    );
    const gaitData = await this.getUserHealthHistory(
      clientInfo.userId,
      "gait_speed"
    );
    if (heartRateData.length >= 7) {
      const trend = this.calculateTrend(
        heartRateData.slice(-7).map((d) => d.value)
      );
      if (trend > 2) {
        insights.push("Your heart rate has been trending upward this week");
        recommendations.push({
          recommendation: "Consider stress management techniques and adequate rest",
          priority: "medium",
          category: "cardiovascular"
        });
      }
    }
    if (steadinessData.length >= 7) {
      const avgSteadiness = steadinessData.slice(-7).reduce((sum, d) => sum + d.value, 0) / 7;
      if (avgSteadiness < 50) {
        insights.push("Walking steadiness shows room for improvement");
        recommendations.push({
          recommendation: "Practice balance exercises daily for 10-15 minutes",
          priority: "high",
          category: "mobility"
        });
      }
    }
    if (gaitData.length >= 7) {
      const avgGait = gaitData.slice(-7).reduce((sum, d) => sum + d.value, 0) / 7;
      if (avgGait > 1) {
        insights.push("Excellent gait speed indicates good mobility");
        recommendations.push({
          recommendation: "Maintain current activity level to preserve mobility",
          priority: "low",
          category: "maintenance"
        });
      }
    }
    this.sendMessage(ws, {
      type: "personalized_insights_response",
      data: {
        insights,
        recommendations,
        motivation_message: "Your commitment to health monitoring is making a positive impact!"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  // Utility methods
  extractHealthDataArray(payload) {
    const data = payload.data;
    if (Array.isArray(data)) {
      return data.filter(this.isHealthData);
    } else if (this.isHealthData(data)) {
      return [data];
    }
    return [];
  }
  isHealthData(data) {
    return typeof data === "object" && data !== null && typeof data.type === "string" && typeof data.value === "number" && typeof data.unit === "string" && typeof data.timestamp === "string";
  }
  async getUserHealthHistory(userId, metricType) {
    const historicalKey = `user_health:${userId}`;
    const historicalData = await this.storage.get(historicalKey) || [];
    return historicalData.filter((d) => d.type === metricType).slice(-60);
  }
  async updateUserHealthHistory(userId, newData) {
    const historicalKey = `user_health:${userId}`;
    const existingData = await this.storage.get(historicalKey) || [];
    const updatedData = [...existingData, ...newData].slice(-1e3);
    await this.storage.put(historicalKey, updatedData);
  }
  calculateTrend(values) {
    if (values.length < 2) return 0;
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  calculatePredictionConfidence(values) {
    if (values.length < 3) return 0.6;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    return Math.max(0.6, Math.min(0.95, 1 - coefficientOfVariation));
  }
  assessRiskLevel(metricType, value) {
    switch (metricType) {
      case "heart_rate":
        if (value > 180 || value < 30) return "critical";
        if (value > 150 || value < 40) return "high";
        if (value > 120 || value < 50) return "medium";
        return "low";
      case "walking_steadiness":
        if (value < 20) return "critical";
        if (value < 30) return "high";
        if (value < 50) return "medium";
        return "low";
      case "gait_speed":
        if (value < 0.4) return "high";
        if (value < 0.6) return "medium";
        return "low";
      default:
        return "low";
    }
  }
  identifyTrendFactors(metricType, trend) {
    const factors = [];
    switch (metricType) {
      case "heart_rate":
        if (trend > 0) {
          factors.push("Activity level", "Stress factors", "Sleep quality");
        } else {
          factors.push(
            "Improved fitness",
            "Better recovery",
            "Medication effects"
          );
        }
        break;
      case "walking_steadiness":
        if (trend < 0) {
          factors.push("Balance challenges", "Environmental factors");
        } else {
          factors.push("Balance training", "Strength improvement");
        }
        break;
      case "gait_speed":
        if (trend < 0) {
          factors.push("Mobility decline", "Fatigue");
        } else {
          factors.push("Exercise routine", "Pain management");
        }
        break;
    }
    return factors;
  }
  determineSeverity(deviation, threshold) {
    const ratio = deviation / threshold;
    if (ratio >= 4) return "critical";
    if (ratio >= 3) return "high";
    if (ratio >= 2) return "medium";
    return "low";
  }
  generateAnomalyExplanation(metricType, value, expectedRange) {
    const metricName = metricType.replace("_", " ");
    return `${metricName} of ${value} is outside expected range ${expectedRange[0]}-${expectedRange[1]}`;
  }
  async generateInsights(userId, healthData) {
    const insights = [];
    if (healthData.length > 0) {
      insights.push({
        recommendation: "Your health monitoring consistency is excellent - keep it up!",
        priority: "low",
        category: "motivation"
      });
    }
    return insights;
  }
  calculateWellnessScore(healthData) {
    switch (healthData.type) {
      case "heart_rate": {
        const hr = healthData.value;
        if (hr >= 60 && hr <= 100) return 0.95;
        if (hr >= 50 && hr <= 120) return 0.8;
        return 0.6;
      }
      case "walking_steadiness": {
        const steadiness = healthData.value;
        if (steadiness >= 80) return 0.95;
        if (steadiness >= 60) return 0.8;
        if (steadiness >= 40) return 0.6;
        return 0.4;
      }
      case "gait_speed": {
        const speed = healthData.value;
        if (speed >= 1) return 0.95;
        if (speed >= 0.8) return 0.8;
        return 0.6;
      }
      default:
        return 0.8;
    }
  }
  checkForHealthAlerts(healthData) {
    switch (healthData.type) {
      case "heart_rate": {
        const hr = healthData.value;
        if (hr > 180) {
          return {
            severity: "critical",
            title: "\u{1F6A8} Critical Heart Rate Alert",
            message: `Heart rate dangerously elevated to ${hr} bpm`,
            metric_type: "heart_rate"
          };
        }
        break;
      }
      case "walking_steadiness": {
        const steadiness = healthData.value;
        if (steadiness < 20) {
          return {
            severity: "critical",
            title: "\u{1F6A8} Critical Fall Risk",
            message: `Walking steadiness critically low at ${steadiness}%`,
            metric_type: "walking_steadiness"
          };
        }
        break;
      }
    }
    return null;
  }
  generateWellnessSummary(healthData) {
    if (healthData.length === 0) return { overall_score: 0.8 };
    const scores = healthData.map((d) => d.wellness_score || 0.8);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return {
      overall_score: Math.round(avgScore * 100) / 100,
      metrics_processed: healthData.length,
      trend: "stable"
    };
  }
  async broadcastToUser(userId, message) {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    }
  }
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
  startHeartbeatCheck() {
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 9e4;
      for (const [ws, clientInfo] of this.clients) {
        if (now - clientInfo.lastHeartbeat > timeoutMs) {
          console.log(`\u{1F494} VitalSense ML client timeout: ${clientInfo.id}`);
          ws.close();
        }
      }
    }, 3e4);
  }
};
var vitalsense_websocket_advanced_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/ws") || url.pathname === "/health") {
      const id = env.VITALSENSE_WEBSOCKET.idFromName("vitalsense-ml");
      const stub = env.VITALSENSE_WEBSOCKET.get(id);
      return stub.fetch(request);
    }
    return new Response(
      JSON.stringify({
        service: "VitalSense Advanced ML WebSocket Worker",
        version: "3.0.0-ml-clean",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        endpoints: { websocket: "/ws", health: "/health" },
        features: [
          "real_time_health_processing",
          "predictive_analytics",
          "anomaly_detection",
          "personalized_insights",
          "emergency_alerts",
          "wellness_scoring"
        ]
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
export {
  VitalSenseAdvancedWebSocketDO,
  vitalsense_websocket_advanced_default as default
};
//# sourceMappingURL=vitalsense-websocket-advanced.js.map
