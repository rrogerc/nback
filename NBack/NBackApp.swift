import AppKit
import SwiftUI

@main
struct NBackApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var model = AppModel()

    var body: some Scene {
        Window("Dual N-Back", id: "main") {
            RootView(model: model)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentMinSize)
        .defaultSize(width: 760, height: 800)
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    func applicationWillFinishLaunching(_ notification: Notification) {
        // Before the window exists, so it never flashes the wrong theme.
        ThemePreference.stored.apply()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }
}

struct RootView: View {
    let model: AppModel

    var body: some View {
        Group {
            switch model.screen {
            case .home:
                HomeView(onStart: model.startGame)
            case .game(let engine):
                GameView(engine: engine, onQuit: model.goHome)
            case .results(let sheet, let level):
                ResultsView(sheet: sheet, level: level, onReturnHome: model.goHome)
            }
        }
        // The game and results scale down below their design sizes, so the window can be
        // small enough for a tiling window manager. The home screen fits as it is.
        .frame(minWidth: 560, minHeight: 530)
        .foregroundStyle(Palette.foreground)
        .background(Palette.background)
        .focusEffectDisabled()
        .onAppear(perform: model.installKeyMonitor)
    }
}
