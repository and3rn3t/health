/**
 * useAlertManagement — CRUD operations and smart alert generation.
 */

import { useKV } from '@/hooks/useLocalKV';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  DEFAULT_GLOBAL_SETTINGS,
  HEALTH_METRICS,
  type AlertHistoryEntry,
  type GlobalSettings,
  type HealthAlert,
} from '@/components/health/alerts/types';

export function useAlertManagement() {
  const [alertsRaw, setAlerts] = useKV<HealthAlert[]>('health-alerts', []);
  const [alertHistoryRaw] = useKV<AlertHistoryEntry[]>('alert-history', []);
  const [globalSettingsRaw, setGlobalSettings] = useKV<GlobalSettings>(
    'alert-global-settings',
    DEFAULT_GLOBAL_SETTINGS
  );

  const alerts: HealthAlert[] = alertsRaw ?? [];
  const alertHistory = alertHistoryRaw ?? [];
  const globalSettings = globalSettingsRaw ?? DEFAULT_GLOBAL_SETTINGS;

  const [newAlert, setNewAlert] = useState<Partial<HealthAlert>>({
    name: '',
    metric: '',
    condition: 'above',
    threshold: 0,
    priority: 'medium',
    frequency: 'immediate',
    enabled: true,
    description: '',
  });

  const [showNewAlertForm, setShowNewAlertForm] = useState(false);

  const createAlert = () => {
    if (
      !newAlert.name ||
      !newAlert.metric ||
      newAlert.threshold === undefined
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    const alert: HealthAlert = {
      id: `alert_${Date.now()}`,
      name: newAlert.name || '',
      metric: newAlert.metric || '',
      condition: newAlert.condition || 'above',
      threshold: newAlert.threshold ?? 0,
      thresholdMax: newAlert.thresholdMax,
      enabled: newAlert.enabled ?? true,
      priority: newAlert.priority || 'medium',
      frequency: newAlert.frequency || 'immediate',
      createdAt: new Date().toISOString(),
      triggerCount: 0,
      description: newAlert.description,
    };

    setAlerts((current) => [...(current ?? []), alert]);
    setNewAlert({
      name: '',
      metric: '',
      condition: 'above',
      threshold: 0,
      priority: 'medium',
      frequency: 'immediate',
      enabled: true,
      description: '',
    });
    setShowNewAlertForm(false);
    toast.success('Alert created successfully');
  };

  const deleteAlert = (alertId: string) => {
    setAlerts((current) =>
      (current ?? []).filter((alert) => alert.id !== alertId)
    );
    toast.success('Alert deleted');
  };

  const toggleAlert = (alertId: string) => {
    setAlerts((current) =>
      (current ?? []).map((alert) =>
        alert.id === alertId ? { ...alert, enabled: !alert.enabled } : alert
      )
    );
  };

  const getMetricLabel = (metric: string): string => {
    return HEALTH_METRICS.find((m) => m.value === metric)?.label || metric;
  };

  const getMetricUnit = (metric: string): string => {
    return HEALTH_METRICS.find((m) => m.value === metric)?.unit || '';
  };

  const generateSmartAlert = (metric: string) => {
    const metricInfo = HEALTH_METRICS.find((m) => m.value === metric);
    if (!metricInfo) return;

    const [min, max] = metricInfo.normalRange as unknown as [number, number];

    const smartAlerts: Partial<HealthAlert>[] = [];

    if (metric === 'fall_risk_score') {
      smartAlerts.push({
        name: `High Fall Risk Alert`,
        metric,
        condition: 'above',
        threshold: 70,
        priority: 'critical',
        frequency: 'immediate',
        description: 'Alert when fall risk score indicates high danger',
      });
    } else if (metric === 'heart_rate') {
      smartAlerts.push(
        {
          name: `High Heart Rate Alert`,
          metric,
          condition: 'above',
          threshold: 120,
          priority: 'high',
          frequency: 'immediate',
          description: 'Alert when heart rate exceeds safe threshold',
        },
        {
          name: `Low Heart Rate Alert`,
          metric,
          condition: 'below',
          threshold: 50,
          priority: 'high',
          frequency: 'immediate',
          description: 'Alert when heart rate drops below safe threshold',
        }
      );
    } else if (min > 0 && max > 0) {
      smartAlerts.push({
        name: `${metricInfo.label} Out of Range`,
        metric,
        condition: 'range_outside',
        threshold: min,
        thresholdMax: max,
        priority: 'medium',
        frequency: 'daily',
        description: `Alert when ${metricInfo.label.toLowerCase()} is outside normal range`,
      });
    }

    smartAlerts.forEach((alertTemplate) => {
      const alert: HealthAlert = {
        id: `alert_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        name: alertTemplate.name!,
        metric: alertTemplate.metric!,
        condition: alertTemplate.condition!,
        threshold: alertTemplate.threshold!,
        thresholdMax: alertTemplate.thresholdMax,
        enabled: true,
        priority: alertTemplate.priority!,
        frequency: alertTemplate.frequency!,
        createdAt: new Date().toISOString(),
        triggerCount: 0,
        description: alertTemplate.description,
      };
      setAlerts((current) => [...(current ?? []), alert]);
    });

    toast.success(`Smart alerts created for ${metricInfo.label}`);
  };

  const activeAlerts = alerts.filter((alert) => alert.enabled);
  const recentlyTriggered = alerts.filter(
    (alert) =>
      alert.lastTriggered &&
      new Date(alert.lastTriggered) >
        new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return {
    alerts,
    alertHistory,
    globalSettings,
    setGlobalSettings,
    newAlert,
    setNewAlert,
    showNewAlertForm,
    setShowNewAlertForm,
    createAlert,
    deleteAlert,
    toggleAlert,
    getMetricLabel,
    getMetricUnit,
    generateSmartAlert,
    activeAlerts,
    recentlyTriggered,
  } as const;
}
