//
//  ContentView.swift
//  VitalSenseWatch Watch App
//
//  Created by Matthew Anderson on 9/26/25.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        if #available(watchOS 9.0, *) {
            VitalSenseWatchDashboard()
        } else {
            VStack(spacing: 16) {
                Image(systemName: "heart.fill")
                    .font(.largeTitle)
                    .foregroundColor(.red)

                Text("VitalSense")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Requires watchOS 9.0+")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
        }
    }
}

#Preview {
    ContentView()
}
