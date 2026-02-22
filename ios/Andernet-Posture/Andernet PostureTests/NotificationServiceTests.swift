//
//  NotificationServiceTests.swift
//  Andernet PostureTests
//
//  Tests for NotificationService protocol behavior via MockNotificationService.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - NotificationServiceTests

@Suite("NotificationService")
struct NotificationServiceTests {

    @Test func requestPermissionGranted() async {
        let service = MockNotificationService()
        service.stubbedPermission = true

        let granted = await service.requestPermission()

        #expect(granted == true)
        #expect(service.requestPermissionCallCount == 1)
    }

    @Test func requestPermissionDenied() async {
        let service = MockNotificationService()
        service.stubbedPermission = false

        let granted = await service.requestPermission()

        #expect(granted == false)
        #expect(service.requestPermissionCallCount == 1)
    }

    @Test func scheduleReminderStoresTime() {
        let service = MockNotificationService()
        service.scheduleSessionReminder(hour: 8, minute: 30)

        #expect(service.scheduleReminderCallCount == 1)
        #expect(service.scheduledHour == 8)
        #expect(service.scheduledMinute == 30)
    }

    @Test func cancelAllRemindersIncrementsCount() {
        let service = MockNotificationService()
        service.cancelAllReminders()
        service.cancelAllReminders()

        #expect(service.cancelAllCallCount == 2)
    }

    @Test func sendDeclineAlertCapturesMetricAndMessage() {
        let service = MockNotificationService()
        service.sendDeclineAlert(metric: "Posture Score", message: "Score dropped to 45")

        #expect(service.sendDeclineAlertCallCount == 1)
        #expect(service.lastAlertMetric == "Posture Score")
        #expect(service.lastAlertMessage == "Score dropped to 45")
    }

    @Test func multipleAlertsTrackLatest() {
        let service = MockNotificationService()
        service.sendDeclineAlert(metric: "Cadence", message: "Low")
        service.sendDeclineAlert(metric: "Speed", message: "Very low")

        #expect(service.sendDeclineAlertCallCount == 2)
        #expect(service.lastAlertMetric == "Speed")
        #expect(service.lastAlertMessage == "Very low")
    }
}
