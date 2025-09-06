# iOS HIG Icon Migration Guide

## Icon Mapping from Phosphor to iOS HIG-Compliant Icons

This document provides a comprehensive mapping of Phosphor icons to iOS 16 Human Interface Guidelines-compliant alternatives using Lucide React icons that closely match SF Symbols.

### Health & Medical Icons

| Phosphor Icon | Lucide Replacement       | SF Symbol Equivalent       | Use Case                          |
| ------------- | ------------------------ | -------------------------- | --------------------------------- |
| `Heart`       | `Heart`                  | `heart`                    | Heart rate, cardiovascular health |
| `Brain`       | `Brain`                  | `brain`                    | Mental health, cognitive function |
| `Shield`      | `Shield` / `ShieldCheck` | `shield`                   | Protection, security              |
| `Phone`       | `Phone`                  | `phone`                    | Emergency contact                 |
| `Warning`     | `AlertTriangle`          | `exclamationmark.triangle` | Alerts, warnings                  |
| `Bell`        | `Bell`                   | `bell`                     | Notifications                     |
| `Activity`    | `Activity`               | `waveform.path.ecg`        | Health activity                   |
| `Pulse`       | `Activity`               | `waveform.path`            | Pulse, vital signs                |

### Analytics & Data Icons

| Phosphor Icon | Lucide Replacement | SF Symbol Equivalent          | Use Case        |
| ------------- | ------------------ | ----------------------------- | --------------- |
| `ChartBar`    | `BarChart3`        | `chart.bar`                   | Bar charts      |
| `TrendUp`     | `TrendingUp`       | `chart.line.uptrend.xyaxis`   | Positive trends |
| `TrendDown`   | `TrendingDown`     | `chart.line.downtrend.xyaxis` | Negative trends |
| `ChartLine`   | `LineChart`        | `chart.xyaxis.line`           | Line charts     |
| `ChartPie`    | `PieChart`         | `chart.pie`                   | Pie charts      |
| `Graph`       | `BarChart`         | `chart.bar.fill`              | General charts  |

### Navigation & Interface Icons

| Phosphor Icon     | Lucide Replacement | SF Symbol Equivalent | Use Case        |
| ----------------- | ------------------ | -------------------- | --------------- |
| `House`           | `Home`             | `house`              | Home navigation |
| `User`            | `User`             | `person`             | User profile    |
| `Users`           | `Users`            | `person.2`           | Multiple users  |
| `Gear`            | `Settings`         | `gear`               | Settings        |
| `MagnifyingGlass` | `Search`           | `magnifyingglass`    | Search          |
| `Plus`            | `Plus`             | `plus`               | Add items       |
| `X`               | `X`                | `xmark`              | Close/cancel    |
| `Check`           | `Check`            | `checkmark`          | Confirmation    |

### System & Status Icons

| Phosphor Icon | Lucide Replacement | SF Symbol Equivalent | Use Case           |
| ------------- | ------------------ | -------------------- | ------------------ |
| `CloudCheck`  | `CloudCheck`       | `checkmark.icloud`   | Cloud sync success |
| `CloudX`      | `CloudOff`         | `xmark.icloud`       | Cloud sync error   |
| `WifiHigh`    | `Wifi`             | `wifi`               | Network connection |
| `WifiSlash`   | `WifiOff`          | `wifi.slash`         | No network         |
| `Battery`     | `Battery`          | `battery.100`        | Battery status     |
| `Lightning`   | `Zap`              | `bolt`               | Power, energy      |

### Action & Control Icons

| Phosphor Icon | Lucide Replacement | SF Symbol Equivalent | Use Case           |
| ------------- | ------------------ | -------------------- | ------------------ |
| `Play`        | `Play`             | `play`               | Start/play actions |
| `Pause`       | `Pause`            | `pause`              | Pause actions      |
| `Stop`        | `Square`           | `stop`               | Stop actions       |
| `ArrowRight`  | `ArrowRight`       | `arrow.right`        | Next/forward       |
| `ArrowLeft`   | `ArrowLeft`        | `arrow.left`         | Previous/back      |
| `Download`    | `Download`         | `arrow.down.to.line` | Download           |
| `Upload`      | `Upload`           | `arrow.up.to.line`   | Upload             |

## iOS HIG Design Principles

### Icon Guidelines

- **Clarity**: Icons should be immediately recognizable
- **Consistency**: Use the same icon for the same concept throughout the app
- **Context**: Icons should make sense in the context they're used
- **Accessibility**: Icons should be accessible to all users

### Size Requirements

- **Small**: 16x16pt for inline text
- **Medium**: 24x24pt for buttons and controls
- **Large**: 32x32pt for headers and primary actions
- **Touch Targets**: Minimum 44x44pt for interactive elements

### Color Guidelines

- Use system colors when possible
- Maintain sufficient contrast (4.5:1 minimum)
- Support both light and dark modes
- Use semantic colors (red for destructive, blue for primary)

## Implementation Strategy

1. **Phase 1**: Replace critical health and emergency icons
2. **Phase 2**: Replace navigation and interface icons
3. **Phase 3**: Replace analytics and data visualization icons
4. **Phase 4**: Replace remaining utility icons

## Testing Requirements

- Test in both light and dark modes
- Verify accessibility with VoiceOver
- Test on various iOS devices and sizes
- Validate touch target sizes meet 44pt minimum
