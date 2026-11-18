import AppKit

/// UserDefaults keys for the settings on the home screen.
enum SettingsKey {
    static let level = "level"
    static let trials = "trials"
    static let feedback = "feedback"
    static let theme = "theme"
}

/// The settings a game runs with, read once when it starts.
struct GameSettings {
    var level: Int
    var trials: Int
    var feedback: Bool

    static func load(from defaults: UserDefaults = .standard) -> GameSettings {
        // A missing or zero value means the default, as `Number(stored) || DEFAULT` did.
        let level = defaults.integer(forKey: SettingsKey.level)
        let trials = defaults.integer(forKey: SettingsKey.trials)
        return GameSettings(
            level: level == 0 ? Rules.defaultLevel : level.clamped(to: Rules.levels),
            trials: trials == 0 ? Rules.defaultTrials : trials.clamped(to: Rules.trialCounts),
            feedback: defaults.object(forKey: SettingsKey.feedback) as? Bool ?? true)
    }
}

enum ThemePreference: String, CaseIterable {
    case system, light, dark

    var label: String {
        switch self {
        case .system: "Auto"
        case .light: "Light"
        case .dark: "Dark"
        }
    }

    /// Sets the appearance for every window. Auto follows the system.
    func apply() {
        NSApp.appearance = switch self {
        case .system: nil
        case .light: NSAppearance(named: .aqua)
        case .dark: NSAppearance(named: .darkAqua)
        }
    }

    static var stored: ThemePreference {
        UserDefaults.standard.string(forKey: SettingsKey.theme).flatMap(Self.init(rawValue:)) ?? .system
    }
}

extension Comparable {
    func clamped(to range: ClosedRange<Self>) -> Self {
        min(max(self, range.lowerBound), range.upperBound)
    }
}
