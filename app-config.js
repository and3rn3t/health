// VitalSense Runtime Configuration
// This file is loaded separately to avoid bundling runtime config

(function () {
  try {
    // Override any defaults if needed
    window.BASE_KV_SERVICE_URL = window.BASE_KV_SERVICE_URL || '';
    window.__VITALSENSE_KV_MODE = window.__VITALSENSE_KV_MODE || 'local';

    // Development mode indicators
    window.__VITALSENSE_DEV_MODE = true;
    window.__VITALSENSE_BUILD_TIME = new Date().toISOString();

    console.log('VitalSense app config loaded');
  } catch (e) {
    console.warn('VitalSense app config failed to load:', e);
  }
})();
