import SwiftUI

// Minimal stubs required only so non-UI tests compile.
struct VitalSenseLogo: View { var size: CGFloat = 120; var showText: Bool = true; var body: some View { Circle().fill(Color.blue).frame(width: size, height: size) } }
struct VitalSenseMetricCard: View { var title=""; var value=""; var unit=""; var icon=""; var body: some View { VStack { Text(value); Text(unit) }.padding() } }
struct VitalSenseStatusIndicator: View { enum HealthStatus { case excellent, good, fair, poor, critical, unknown }; var status: HealthStatus = .good; var title=""; var subtitle:String?=nil; var body: some View { Text(title) } }
struct VitalSenseProgressRing: View { var progress: Double = 0; var title=""; var subtitle=""; var body: some View { ZStack { Circle().stroke(Color.blue.opacity(0.2), lineWidth: 6); Circle().trim(from: 0, to: progress).stroke(Color.blue, lineWidth: 6).rotationEffect(.degrees(-90)) }.frame(width: 80, height: 80) } }
struct VitalSenseFAB: View { var icon="plus"; var action:()->Void = {}; var body: some View { Button(action: action){ Image(systemName: icon) } } }
struct VitalSenseNavigationHeader: View { var title=""; var subtitle:String?=nil; var showLogo:Bool=false; var body: some View { HStack { if showLogo { VitalSenseLogo(size:24, showText:false) }; Text(title).bold(); Spacer() }.padding() } }
struct VitalSenseFloatingActionButton: View { var icon="plus"; var action:()->Void = {}; var body: some View { Button(action: action){ Image(systemName: icon).padding().background(Circle().fill(Color.blue)) } } }
struct VitalSenseProgressRingAdvanced: View { var progress:Double=0; var value:String=""; var body: some View { VStack { VitalSenseProgressRing(progress: progress); Text(value) } } }
extension View { func pressEvents(onPress: @escaping ()->Void = {}, onRelease: @escaping ()->Void = {}) -> some View { self } }
