import SwiftUI

/// The board during a game: clock and trial count, the grid, the match buttons, and the
/// live score.
struct GameView: View {
    let engine: GameEngine
    let onQuit: () -> Void

    @State private var positionFrame = CGRect.zero
    @State private var soundFrame = CGRect.zero

    nonisolated private static let space = "game"
    /// The smallest window area the board lays out in before it scales down to fit.
    private static let designSize = CGSize(width: 680, height: 680)

    var body: some View {
        GeometryReader { proxy in
            let scale = fitScale(proxy.size, minimum: Self.designSize)
            // The web version sized the grid in vmin, 1% of the viewport's shorter side.
            let vmin = min(proxy.size.width, proxy.size.height) / scale / 100
            ZStack(alignment: .topTrailing) {
                card(vmin: vmin)
                    .padding(.vertical, 20)
                    .padding(.horizontal, 40)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    // Clicks fall through to the catcher underneath.
                    .allowsHitTesting(false)
                pauseToggle
                    .padding(16)
            }
            .coordinateSpace(.named(Self.space))
            .blur(radius: engine.isPaused ? 4 : 0)
            .scaled(scale, into: proxy.size)
            .background {
                // Outside the scaling, so its points are converted into the board's.
                ClickCatcher { point, button in
                    respond(at: CGPoint(x: point.x / scale, y: point.y / scale), button: button)
                }
            }
        }
        .overlay {
            if engine.isPaused {
                PauseOverlay(onResume: engine.togglePause, onQuit: onQuit)
            }
        }
    }

    /// Left-click is a position match and right-click a sound match, except that clicking
    /// a match button always counts as that button.
    private func respond(at point: CGPoint, button: MouseButton) {
        if positionFrame.contains(point) {
            engine.respond(.position)
        } else if soundFrame.contains(point) {
            engine.respond(.sound)
        } else {
            engine.respond(button == .left ? .position : .sound)
        }
    }

    private func card(vmin: CGFloat) -> some View {
        VStack(spacing: 0) {
            TrialsBar(engine: engine)
                .padding(.vertical, 15)
            GridPanel(litCell: engine.litCell, vmin: vmin)
            HStack(spacing: 20) {
                MatchKey(title: "Position", fill: fill(pressed: engine.positionPressed, match: engine.positionMatch))
                    .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(Self.space)) } action: {
                        positionFrame = $0
                    }
                MatchKey(title: "Sound", fill: fill(pressed: engine.soundPressed, match: engine.soundMatch))
                    .onGeometryChange(for: CGRect.self) { $0.frame(in: .named(Self.space)) } action: {
                        soundFrame = $0
                    }
            }
            .padding(.vertical, 20)
            LiveScore(score: engine.liveScore)
                .padding(.top, 15)
                // Hidden rather than removed, so the layout doesn't shift when it appears.
                .opacity(engine.settings.feedback && engine.trialsShown > 0 ? 1 : 0)
        }
    }

    private func fill(pressed: Bool, match: Bool) -> MatchKey.Fill {
        guard pressed else { return .none }
        guard engine.settings.feedback else { return .blue }
        return match ? .green : .red
    }

    private var pauseToggle: some View {
        Button(action: engine.togglePause) {
            // U+FE0E keeps the triangle a text glyph instead of an emoji.
            Text(verbatim: engine.isPaused ? "\u{25B6}\u{FE0E}" : "\u{2759}\u{2759}")
        }
        .buttonStyle(OutlineButtonStyle(
            fontSize: 14, paddingV: 5, paddingH: 10, cornerRadius: 6, tracking: 1, restingOpacity: 0.5))
        .help("Pause (Esc)")
    }
}

private struct TrialsBar: View {
    let engine: GameEngine

    var body: some View {
        HStack {
            HStack(spacing: 12) {
                ClockFace(engine: engine)
                // The web version refreshed its timer every 100 ms.
                TimelineView(.animation(minimumInterval: 0.1, paused: engine.isPaused)) { _ in
                    Text(verbatim: TimeFormat.elapsed(engine.elapsedMs()))
                        .font(.system(size: 20, weight: .semibold))
                        .monospacedDigit()
                }
            }
            Spacer()
            HStack(spacing: 10) {
                Circle()
                    .fill(Palette.green)
                    .frame(width: 10, height: 10)
                    .shadow(color: Palette.green, radius: 7.5)
                    .shadow(color: Palette.green, radius: 15)
                HStack(alignment: .firstTextBaseline, spacing: 0) {
                    Text(verbatim: "\(engine.trialsShown) /\u{00A0}")
                    Text(verbatim: String(engine.settings.trials))
                        .frame(width: 60)
                        .padding(.bottom, 2)
                        .overlay(alignment: .bottom) { Palette.foreground.frame(height: 2) }
                }
                .font(.system(size: 26, weight: .semibold))
            }
        }
    }
}

/// A ring with a yellow left quarter, and a hand that sweeps once per trial.
private struct ClockFace: View {
    let engine: GameEngine

    var body: some View {
        TimelineView(.animation(paused: engine.isPaused)) { _ in
            let progress = Double(engine.elapsedMs() % Rules.trialMs) / Double(Rules.trialMs)
            ZStack {
                Circle().strokeBorder(Palette.foreground, lineWidth: 3)
                // Circle paths start at 3 o'clock, so this range is centered on 9 o'clock.
                Circle().inset(by: 1.5).trim(from: 0.375, to: 0.625).stroke(Palette.yellow, lineWidth: 3)
                // The web version's hand was a bar 80% of the inner width with only its left
                // half visible. Each half was an ellipse.
                Ellipse()
                    .fill(Palette.foreground)
                    .frame(width: 17.6, height: 2.4)
                    .frame(width: 35.2, alignment: .leading)
                    .rotationEffect(.degrees(progress * 360))
            }
        }
        .frame(width: 50, height: 50)
    }
}

private struct GridPanel: View {
    let litCell: Int
    let vmin: CGFloat

    var body: some View {
        let side = (22 * vmin).clamped(to: 60...110)
        VStack(spacing: 10) {
            ForEach(0..<3, id: \.self) { row in
                HStack(spacing: 10) {
                    ForEach(0..<3, id: \.self) { column in
                        GridCell(isLit: litCell != 0 && litCell == Self.cellNumber(row: row, column: column))
                            .frame(width: side, height: side)
                    }
                }
            }
        }
        .padding((2 * vmin).clamped(to: 10...30))
    }

    /// Cells are numbered 1 to 8 left to right and top to bottom. The center is 0 and never lights.
    private static func cellNumber(row: Int, column: Int) -> Int {
        let index = row * 3 + column
        return index < 4 ? index + 1 : index == 4 ? 0 : index
    }
}

private struct GridCell: View {
    let isLit: Bool

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 5)
        shape
            .fill(isLit ? Palette.yellow : .clear)
            .overlay(shape.strokeBorder(Palette.foreground, lineWidth: 2))
            .animation(.cssEase(0.1), value: isLit)
    }
}

/// The Position and Sound buttons. They only display state; clicks reach the game through
/// the click catcher, and the keyboard through the app's key monitor.
private struct MatchKey: View {
    enum Fill {
        case none, blue, green, red
    }

    let title: String
    let fill: Fill

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 10)
        let color: Color? = switch fill {
        case .none: nil
        case .blue: Palette.blue
        case .green: Palette.green
        case .red: Palette.red
        }
        Text(verbatim: title)
            .font(.system(size: 18, weight: .semibold))
            .tracking(0.3)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .padding(.horizontal, 20)
            .background(shape.fill(color ?? .clear))
            .overlay(shape.strokeBorder(color ?? Palette.foreground, lineWidth: 1.5))
            .animation(.cssEase(0.15), value: fill)
    }
}

private struct LiveScore: View {
    let score: ScoreSheet

    var body: some View {
        HStack(spacing: 12) {
            Text("Spatial \(percent(Percent.trimmed(score.spatial.score), Palette.green))")
            divider
            Text("Auditory \(percent(Percent.trimmed(score.auditory.score), Palette.green))")
            divider
            Text("Total \(percent(Percent.fixed(score.total), Palette.yellow))")
        }
        .font(.system(size: 14, weight: .semibold))
        .opacity(0.6)
    }

    private var divider: some View {
        Text(verbatim: "|").opacity(0.3)
    }

    private func percent(_ value: String, _ color: Color) -> Text {
        Text(verbatim: value + "%").foregroundStyle(color)
    }
}

private struct PauseOverlay: View {
    let onResume: () -> Void
    let onQuit: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
            VStack(spacing: 24) {
                Text("Paused")
                    .font(.system(size: 36, weight: .bold))
                    .tracking(-0.72)
                HStack(spacing: 16) {
                    Button("Resume", action: onResume)
                        .buttonStyle(OutlineButtonStyle(fontSize: 18, paddingV: 10, paddingH: 30))
                    Button("Quit", action: onQuit)
                        .buttonStyle(OutlineButtonStyle(fontSize: 18, paddingV: 10, paddingH: 30, restingOpacity: 0.6))
                }
                HStack(spacing: 4) {
                    Text("Press")
                    Text("Esc")
                        .padding(.vertical, 1.5)
                        .padding(.horizontal, 5)
                        .overlay(RoundedRectangle(cornerRadius: 3).strokeBorder(lineWidth: 1))
                    Text("to resume")
                }
                .font(.system(size: 13))
                .opacity(0.45)
            }
            .padding(.vertical, 40)
            .padding(.horizontal, 50)
            .background(RoundedRectangle(cornerRadius: 16).fill(Palette.background))
            .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Palette.foreground, lineWidth: 1.5))
        }
    }
}
