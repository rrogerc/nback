import AppKit
import Observation

/// Which screen is showing, and the keyboard shortcuts for each.
@Observable
final class AppModel {
    enum Screen {
        case home
        case game(GameEngine)
        case results(ScoreSheet, level: Int)
    }

    private(set) var screen = Screen.home
    @ObservationIgnored private let sounds = SoundBank()
    @ObservationIgnored private var keyMonitor: Any?

    func startGame() {
        let settings = GameSettings.load()
        let engine = GameEngine(settings: settings, sounds: sounds)
        engine.onFinish = { [weak self] sheet in
            self?.screen = .results(sheet, level: settings.level)
        }
        screen = .game(engine)
        engine.start()
    }

    func goHome() {
        if case .game(let engine) = screen { engine.stop() }
        screen = .home
    }

    /// Shortcuts work wherever focus is, including in the trials field, as the web
    /// version's window-level listeners did.
    func installKeyMonitor() {
        guard keyMonitor == nil else { return }
        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self, handleKey(event) else { return event }
            return nil
        }
    }

    /// Returns whether the key was consumed.
    private func handleKey(_ event: NSEvent) -> Bool {
        // Leave menu shortcuts and function keys to the system.
        guard event.modifierFlags.isDisjoint(with: [.command, .control, .function]) else { return false }
        switch screen {
        case .home:
            guard event.keyCode == KeyCode.s else { return false }
            if !event.isARepeat { startGame() }
            return true
        case .game(let engine):
            if !event.isARepeat {
                switch event.keyCode {
                case KeyCode.escape: engine.togglePause()
                case KeyCode.a: engine.respond(.position)
                case KeyCode.l: engine.respond(.sound)
                default: break
                }
            }
            // Swallow every key during a game so a stray press can't beep.
            return true
        case .results:
            guard event.keyCode == KeyCode.escape else { return false }
            goHome()
            return true
        }
    }
}

/// Physical key positions, matching the web version's `KeyboardEvent.code` checks, so the
/// keys stay put on non-QWERTY layouts.
private enum KeyCode {
    static let a: UInt16 = 0x00
    static let s: UInt16 = 0x01
    static let l: UInt16 = 0x25
    static let escape: UInt16 = 0x35
}
