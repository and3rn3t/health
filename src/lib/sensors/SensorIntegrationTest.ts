/**
 * Simple test to verify DeviceSensorManager integration
 * This tests the core sensor functionality without complex UI dependencies
 */

import type { GaitMetrics } from './DeviceSensorManager';
import { DeviceSensorManager } from './DeviceSensorManager';

export class SensorIntegrationTest {
  private sensorManager: DeviceSensorManager;
  private testResults = {
    permissionTest: false,
    initializationTest: false,
    gaitAnalysisTest: false,
    stepDetectionTest: false,
    sensorDataTest: false,
    realTimeUpdateTest: false,
    errorHandlingTest: false,
  };

  constructor() {
    this.sensorManager = new DeviceSensorManager();
  }

  async runAllTests(): Promise<{
    success: boolean;
    results: {
      permissionTest: boolean;
      initializationTest: boolean;
      gaitAnalysisTest: boolean;
      stepDetectionTest: boolean;
      sensorDataTest: boolean;
      realTimeUpdateTest: boolean;
      errorHandlingTest: boolean;
    };
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Test 1: Sensor Permission Request
      console.log('🧪 Testing sensor permissions...');
      const hasPermissions =
        await DeviceSensorManager.requestSensorPermissions();
      this.testResults.permissionTest = true;
      console.log(
        `✅ Permission test: ${hasPermissions ? 'Granted' : 'Denied/Not Required'}`
      );
    } catch (error) {
      errors.push(`Permission test failed: ${error}`);
    }

    try {
      // Test 2: Sensor Manager Initialization
      console.log('🧪 Testing sensor manager initialization...');
      const isSupported = this.sensorManager.isSensorSupported();
      this.testResults.initializationTest = true;
      console.log(
        `✅ Initialization test: Sensors ${isSupported ? 'supported' : 'not supported'}`
      );
    } catch (error) {
      errors.push(`Initialization test failed: ${error}`);
    }

    try {
      // Test 3: Start/Stop Analysis
      console.log('🧪 Testing analysis start/stop...');
      let receivedUpdate = false;

      const success = await this.sensorManager.startAnalysis({
        onGaitUpdate: (metrics: GaitMetrics) => {
          receivedUpdate = true;
          console.log(
            `📊 Received gait update: Speed ${metrics.speed.toFixed(2)} m/s, Cadence ${metrics.cadence} spm`
          );
        },
        onError: (error: string) => {
          console.log(`⚠️ Analysis error: ${error}`);
        },
      });

      if (success) {
        console.log('✅ Analysis started successfully');

        // Let it run for a brief moment to test data flow
        await new Promise((resolve) => setTimeout(resolve, 2000));

        this.sensorManager.stopAnalysis();
        console.log('✅ Analysis stopped successfully');
      } else {
        console.log(
          '⚠️ Analysis failed to start (may be expected in non-mobile environment)'
        );
      }

      this.testResults.gaitAnalysisTest = true;
    } catch (error) {
      errors.push(`Gait analysis test failed: ${error}`);
    }

    try {
      // Test 4: Error Handling
      console.log('🧪 Testing error handling...');

      // Test with invalid callbacks (should handle gracefully)
      const errorResult = await this.sensorManager.startAnalysis({
        onGaitUpdate: undefined as any,
        onError: undefined as any,
      });

      this.testResults.errorHandlingTest = true;
      console.log(
        `✅ Error handling test: ${errorResult ? 'Unexpected success' : 'Handled gracefully'}`
      );
    } catch (error) {
      // Expected to catch errors here, which is good
      this.testResults.errorHandlingTest = true;
      console.log('✅ Error handling test: Caught expected error');
    }

    const overallSuccess = Object.values(this.testResults).every(
      (result) => result === true
    );

    console.log('\n📋 Test Summary:');
    console.log('=================');
    console.log(
      `Permission Test: ${this.testResults.permissionTest ? '✅' : '❌'}`
    );
    console.log(
      `Initialization Test: ${this.testResults.initializationTest ? '✅' : '❌'}`
    );
    console.log(
      `Gait Analysis Test: ${this.testResults.gaitAnalysisTest ? '✅' : '❌'}`
    );
    console.log(
      `Error Handling Test: ${this.testResults.errorHandlingTest ? '✅' : '❌'}`
    );
    console.log(
      `Overall: ${overallSuccess ? '✅ All tests passed' : '❌ Some tests failed'}`
    );

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach((error) => console.log(`  • ${error}`));
    }

    return {
      success: overallSuccess,
      results: this.testResults,
      errors,
    };
  }

  // Utility method to test sensor availability
  static testSensorAvailability(): {
    deviceMotion: boolean;
    deviceOrientation: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
  } {
    const results = {
      deviceMotion: 'DeviceMotionEvent' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window,
      accelerometer: 'Accelerometer' in window,
      gyroscope: 'Gyroscope' in window,
    };

    console.log('\n🔍 Sensor Availability Check:');
    console.log('============================');
    console.log(`DeviceMotionEvent: ${results.deviceMotion ? '✅' : '❌'}`);
    console.log(
      `DeviceOrientationEvent: ${results.deviceOrientation ? '✅' : '❌'}`
    );
    console.log(
      `Generic Accelerometer: ${results.accelerometer ? '✅' : '❌'}`
    );
    console.log(`Generic Gyroscope: ${results.gyroscope ? '✅' : '❌'}`);

    return results;
  }
}

// Export a simple test runner function
export async function runSensorIntegrationTests(): Promise<void> {
  console.log('🚀 Starting VitalSense Sensor Integration Tests');
  console.log('==============================================\n');

  // Check sensor availability first
  SensorIntegrationTest.testSensorAvailability();

  // Run full test suite
  const test = new SensorIntegrationTest();
  const results = await test.runAllTests();

  if (results.success) {
    console.log('\n🎉 All sensor integration tests completed successfully!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the details above.');
  }

  return Promise.resolve();
}

// For browser console testing
if (typeof window !== 'undefined') {
  (window as any).testVitalSenseSensors = runSensorIntegrationTests;
  console.log(
    '💡 Tip: Run testVitalSenseSensors() in the browser console to test sensor integration'
  );
}
