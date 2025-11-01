//
//  EmergencyResponseView.swift
//  VitalSense
//
//  Emergency response interface for safety and caregiver notifications
//  Created: 2025-11-01
//

import SwiftUI

struct EmergencyResponseView: View {
    @StateObject private var emergencySystem = EmergencyResponseSystem.shared
    @State private var showingAddContact = false
    @State private var showingSOSConfirmation = false
    @State private var selectedContact: EmergencyContact?

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Emergency Status
                emergencyStatusView

                // SOS Button
                sosButtonView

                // Active Alerts
                if !emergencySystem.activeAlerts.isEmpty {
                    activeAlertsView
                }

                // Emergency Contacts
                emergencyContactsView

                // Response History
                responseHistoryView
            }
            .padding(.horizontal)
        }
        .navigationTitle("Emergency Response")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Add Contact") {
                    showingAddContact = true
                }
            }
        }
        .sheet(isPresented: $showingAddContact) {
            AddEmergencyContactView()
        }
        .alert("Emergency SOS", isPresented: $showingSOSConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Call Emergency Services", role: .destructive) {
                emergencySystem.initiateSOSCall()
            }
        } message: {
            Text("This will immediately call emergency services and notify your emergency contacts.")
        }
        .onAppear {
            Task {
                await emergencySystem.setupEmergencySystem()
            }
        }
    }

    // MARK: - Emergency Status View

    private var emergencyStatusView: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: emergencySystem.isEmergencyActive ? "exclamationmark.octagon.fill" : "checkmark.shield.fill")
                    .font(.title)
                    .foregroundColor(emergencySystem.isEmergencyActive ? .red : .green)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Emergency Status")
                        .font(.headline)

                    Text(emergencySystem.isEmergencyActive ? "Active Emergency" : "System Ready")
                        .font(.subheadline)
                        .foregroundColor(emergencySystem.isEmergencyActive ? .red : .green)
                }

                Spacer()

                if emergencySystem.isEmergencyActive {
                    Button("Cancel") {
                        emergencySystem.cancelEmergencyResponse()
                    }
                    .foregroundColor(.red)
                    .fontWeight(.semibold)
                }
            }

            if emergencySystem.isEmergencyActive && emergencySystem.sosCountdown > 0 {
                CountdownView(countdown: emergencySystem.sosCountdown)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - SOS Button View

    private var sosButtonView: some View {
        VStack(spacing: 16) {
            Text("Emergency SOS")
                .font(.headline)

            Button(action: { showingSOSConfirmation = true }) {
                VStack(spacing: 8) {
                    Image(systemName: "phone.fill")
                        .font(.system(size: 40))

                    Text("Emergency Call")
                        .font(.headline)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(width: 150, height: 150)
                .background(
                    Circle()
                        .fill(Color.red)
                        .shadow(color: .red.opacity(0.4), radius: 10, x: 0, y: 5)
                )
            }
            .disabled(emergencySystem.isEmergencyActive)

            Text("Press and hold to call emergency services and notify contacts")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }

    // MARK: - Active Alerts View

    private var activeAlertsView: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active Alerts")
                .font(.headline)
                .foregroundColor(.red)

            ForEach(emergencySystem.activeAlerts, id: \.id) { alert in
                AlertCard(alert: alert)
            }
        }
        .padding()
        .background(Color.red.opacity(0.05))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }

    // MARK: - Emergency Contacts View

    private var emergencyContactsView: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Emergency Contacts")
                    .font(.headline)

                Spacer()

                Text("\(emergencySystem.emergencyContacts.count) contacts")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if emergencySystem.emergencyContacts.isEmpty {
                EmptyContactsView()
            } else {
                ForEach(emergencySystem.emergencyContacts, id: \.id) { contact in
                    EmergencyContactRow(contact: contact) {
                        selectedContact = contact
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
        .sheet(item: $selectedContact) { contact in
            EditEmergencyContactView(contact: contact)
        }
    }

    // MARK: - Response History View

    private var responseHistoryView: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Response History")
                .font(.headline)

            if emergencySystem.responseHistory.isEmpty {
                Text("No emergency responses recorded")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding()
            } else {
                ForEach(emergencySystem.responseHistory.prefix(5), id: \.id) { response in
                    ResponseHistoryRow(response: response)
                }

                if emergencySystem.responseHistory.count > 5 {
                    Button("View All History") {
                        // Navigate to full history view
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 2, x: 0, y: 1)
    }
}

// MARK: - Supporting Views

struct CountdownView: View {
    let countdown: Int

    var body: some View {
        VStack(spacing: 8) {
            Text("Calling Emergency Services in:")
                .font(.subheadline)
                .foregroundColor(.red)

            Text("\(countdown)")
                .font(.system(size: 48, weight: .bold, design: .monospaced))
                .foregroundColor(.red)

            Text("Press Cancel to stop")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }
}

struct AlertCard: View {
    let alert: EmergencyAlert

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: alert.type.icon)
                .font(.title2)
                .foregroundColor(alert.severity.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(alert.type.displayName)
                    .font(.subheadline)
                    .fontWeight(.semibold)

                Text(alert.message)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(alert.timestamp.formatted(date: .omitted, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack {
                Text(severityText(for: alert.severity))
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(alert.severity.color.opacity(0.2))
                    .cornerRadius(4)

                if let fallRisk = alert.fallRisk {
                    Text("\(Int(fallRisk * 100))%")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }

    private func severityText(for severity: EmergencyAlert.EmergencySeverity) -> String {
        switch severity {
        case .low: return "LOW"
        case .medium: return "MED"
        case .high: return "HIGH"
        case .critical: return "CRIT"
        }
    }
}

struct EmptyContactsView: View {
    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "person.badge.plus")
                .font(.system(size: 40))
                .foregroundColor(.secondary)

            Text("No Emergency Contacts")
                .font(.headline)
                .foregroundColor(.secondary)

            Text("Add emergency contacts to receive notifications during emergencies")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity)
    }
}

struct EmergencyContactRow: View {
    let contact: EmergencyContact
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: contact.isPrimary ? "person.crop.circle.fill" : "person.crop.circle")
                    .font(.title2)
                    .foregroundColor(contact.isPrimary ? .blue : .secondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(contact.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)

                    Text(contact.relationship)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(contact.phoneNumber)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(spacing: 2) {
                    Text(contact.preferredMethod.rawValue)
                        .font(.caption2)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.2))
                        .cornerRadius(4)

                    if contact.isPrimary {
                        Text("PRIMARY")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)
                    }
                }

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(8)
            .background(Color(.systemGray6))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct ResponseHistoryRow: View {
    let response: EmergencyResponse

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconForResponseType(response.type))
                .font(.subheadline)
                .foregroundColor(colorForResponseType(response.type))

            VStack(alignment: .leading, spacing: 2) {
                Text(textForResponseType(response.type))
                    .font(.caption)
                    .fontWeight(.medium)

                Text(response.timestamp.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if response.responseTime > 0 {
                Text("\(response.responseTime)s")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(6)
    }

    private func iconForResponseType(_ type: EmergencyResponse.ResponseType) -> String {
        switch type {
        case .emergencyTriggered: return "exclamationmark.circle"
        case .sosCallInitiated: return "phone.fill"
        case .callInitiated: return "phone.fill"
        case .smsNotificationSent: return "message.fill"
        case .emailNotificationSent: return "envelope.fill"
        case .emergencyCancelled: return "xmark.circle"
        }
    }

    private func colorForResponseType(_ type: EmergencyResponse.ResponseType) -> Color {
        switch type {
        case .emergencyTriggered: return .red
        case .sosCallInitiated: return .red
        case .callInitiated: return .blue
        case .smsNotificationSent: return .green
        case .emailNotificationSent: return .orange
        case .emergencyCancelled: return .gray
        }
    }

    private func textForResponseType(_ type: EmergencyResponse.ResponseType) -> String {
        switch type {
        case .emergencyTriggered: return "Emergency Triggered"
        case .sosCallInitiated: return "SOS Call Made"
        case .callInitiated: return "Contact Called"
        case .smsNotificationSent: return "SMS Sent"
        case .emailNotificationSent: return "Email Sent"
        case .emergencyCancelled: return "Emergency Cancelled"
        }
    }
}

// MARK: - Add/Edit Contact Views

struct AddEmergencyContactView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var phoneNumber = ""
    @State private var email = ""
    @State private var relationship = ""
    @State private var preferredMethod: EmergencyContact.ContactMethod = .sms
    @State private var isPrimary = false

    var body: some View {
        NavigationView {
            Form {
                Section("Contact Information") {
                    TextField("Name", text: $name)
                    TextField("Phone Number", text: $phoneNumber)
                        .keyboardType(.phonePad)
                    TextField("Email (Optional)", text: $email)
                        .keyboardType(.emailAddress)
                    TextField("Relationship", text: $relationship)
                }

                Section("Notification Preferences") {
                    Picker("Preferred Method", selection: $preferredMethod) {
                        ForEach(EmergencyContact.ContactMethod.allCases, id: \.self) { method in
                            Text(method.rawValue).tag(method)
                        }
                    }

                    Toggle("Primary Contact", isOn: $isPrimary)
                }
            }
            .navigationTitle("Add Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveContact()
                    }
                    .disabled(name.isEmpty || phoneNumber.isEmpty)
                }
            }
        }
    }

    private func saveContact() {
        let contact = EmergencyContact(
            name: name,
            phoneNumber: phoneNumber,
            email: email.isEmpty ? nil : email,
            relationship: relationship,
            preferredMethod: preferredMethod,
            isPrimary: isPrimary
        )

        EmergencyResponseSystem.shared.addEmergencyContact(contact)
        dismiss()
    }
}

struct EditEmergencyContactView: View {
    @Environment(\.dismiss) private var dismiss
    let contact: EmergencyContact

    @State private var name: String
    @State private var phoneNumber: String
    @State private var email: String
    @State private var relationship: String
    @State private var preferredMethod: EmergencyContact.ContactMethod
    @State private var isPrimary: Bool

    init(contact: EmergencyContact) {
        self.contact = contact
        _name = State(initialValue: contact.name)
        _phoneNumber = State(initialValue: contact.phoneNumber)
        _email = State(initialValue: contact.email ?? "")
        _relationship = State(initialValue: contact.relationship)
        _preferredMethod = State(initialValue: contact.preferredMethod)
        _isPrimary = State(initialValue: contact.isPrimary)
    }

    var body: some View {
        NavigationView {
            Form {
                Section("Contact Information") {
                    TextField("Name", text: $name)
                    TextField("Phone Number", text: $phoneNumber)
                        .keyboardType(.phonePad)
                    TextField("Email (Optional)", text: $email)
                        .keyboardType(.emailAddress)
                    TextField("Relationship", text: $relationship)
                }

                Section("Notification Preferences") {
                    Picker("Preferred Method", selection: $preferredMethod) {
                        ForEach(EmergencyContact.ContactMethod.allCases, id: \.self) { method in
                            Text(method.rawValue).tag(method)
                        }
                    }

                    Toggle("Primary Contact", isOn: $isPrimary)
                }

                Section {
                    Button("Remove Contact", role: .destructive) {
                        removeContact()
                    }
                }
            }
            .navigationTitle("Edit Contact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveChanges()
                    }
                }
            }
        }
    }

    private func saveChanges() {
        // Remove old contact and add updated one
        EmergencyResponseSystem.shared.removeEmergencyContact(contact)

        let updatedContact = EmergencyContact(
            name: name,
            phoneNumber: phoneNumber,
            email: email.isEmpty ? nil : email,
            relationship: relationship,
            preferredMethod: preferredMethod,
            isPrimary: isPrimary
        )

        EmergencyResponseSystem.shared.addEmergencyContact(updatedContact)
        dismiss()
    }

    private func removeContact() {
        EmergencyResponseSystem.shared.removeEmergencyContact(contact)
        dismiss()
    }
}

#Preview {
    NavigationView {
        EmergencyResponseView()
    }
}
