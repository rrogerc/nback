import SwiftUI

struct HomeView: View {
    let onStart: () -> Void

    @AppStorage(SettingsKey.level) private var level = Rules.defaultLevel
    @AppStorage(SettingsKey.trials) private var trials = Rules.defaultTrials
    @State private var trialsText: String
    @State private var isShowingSettings = false
    @FocusState private var focus: Focus?

    /// The page itself takes focus by default. Otherwise macOS focuses the trials field
    /// whenever the window becomes key, where the web version left it alone until clicked.
    private enum Focus: Hashable {
        case page, trials
    }

    init(onStart: @escaping () -> Void) {
        self.onStart = onStart
        _trialsText = State(initialValue: String(GameSettings.load().trials))
    }

    var body: some View {
        VStack(spacing: 30) {
            Text("Dual \(Text("N").foregroundStyle(Palette.yellow))-Back")
                .font(.system(size: 48, weight: .bold))
                .tracking(-0.96)

            VStack(spacing: 25) {
                settingRow("N-Back Level") { levelSelector }
                settingRow("Trials") { trialsField }
            }

            Button("Start", action: start)
                .buttonStyle(OutlineButtonStyle(fontSize: 22, paddingV: 14, paddingH: 50))
        }
        .padding(.vertical, 40)
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .contentShape(Rectangle())
        // Clicking elsewhere ends editing, as a blur did.
        .onTapGesture(perform: endEditing)
        .focusable()
        .focused($focus, equals: .page)
        .defaultFocus($focus, .page)
        .overlay(alignment: .topTrailing) {
            settingsButton
                .padding(16)
        }
        .onChange(of: trialsText) { _, text in trialsTextChanged(text) }
        .onChange(of: focus) { old, new in
            if old == .trials && new != .trials { commitTrials() }
        }
    }

    private func settingRow<Control: View>(
        _ label: String, @ViewBuilder control: () -> Control
    ) -> some View {
        HStack(spacing: 20) {
            Text(label)
                .font(.system(size: 20, weight: .semibold))
                .frame(minWidth: 140, alignment: .trailing)
            control()
        }
    }

    private var levelSelector: some View {
        HStack(spacing: 0) {
            ArrowButton(pointsUp: false) { level = (level - 1).clamped(to: Rules.levels) }
            Text(String(level))
                .font(.system(size: 32, weight: .bold))
                .frame(minWidth: 40)
            ArrowButton(pointsUp: true) { level = (level + 1).clamped(to: Rules.levels) }
        }
        // The arrows overhang the row like the web version's negative margins, which keeps
        // the two rows centered the same way.
        .padding(.horizontal, -20)
    }

    private var trialsField: some View {
        HStack(alignment: .firstTextBaseline, spacing: 0) {
            TextField("", text: $trialsText)
                .textFieldStyle(.plain)
                .font(.system(size: 26, weight: .semibold))
                .multilineTextAlignment(.center)
                .focused($focus, equals: .trials)
                .onSubmit(endEditing)
                .frame(width: 70)
                .padding(.bottom, 2)
                .overlay(alignment: .bottom) {
                    (focus == .trials ? Palette.yellow : Palette.foreground).frame(height: 2)
                }
                .animation(.cssEase(0.15), value: focus)
            // Zero width, so the readout hangs to the right without moving the centered field.
            Text(durationText)
                .font(.system(size: 18, weight: .semibold))
                .monospacedDigit()
                .opacity(0.6)
                .fixedSize()
                .padding(.leading, 14)
                .frame(width: 0, alignment: .leading)
        }
    }

    /// Styled and placed like the pause button in a game.
    private var settingsButton: some View {
        Button {
            isShowingSettings.toggle()
        } label: {
            Label("Settings", systemImage: "gearshape")
                .labelStyle(.iconOnly)
        }
        .buttonStyle(OutlineButtonStyle(
            fontSize: 14, paddingV: 5, paddingH: 10, cornerRadius: 6, restingOpacity: 0.5))
        .help("Settings")
        .popover(isPresented: $isShowingSettings, arrowEdge: .bottom) {
            SettingsPanel()
        }
    }

    /// The game length for the typed count. Empty or zero shows nothing until committed.
    private var durationText: String {
        guard let count = Int(trialsText), count >= Rules.trialCounts.lowerBound else { return "" }
        return TimeFormat.duration(Rules.gameDurationMs(trials: count))
    }

    /// Keeps the field to digits and at most 999, saving each valid count as it's typed.
    private func trialsTextChanged(_ text: String) {
        let digits = text.filter { $0.isASCII && $0.isNumber }
        guard !digits.isEmpty else {
            if digits != text { trialsText = digits }
            return
        }
        let value = Int(digits) ?? .max
        let clamped = min(value, Rules.trialCounts.upperBound)
        if clamped >= Rules.trialCounts.lowerBound { trials = clamped }
        let normalized = clamped == value ? digits : String(clamped)
        if normalized != text { trialsText = normalized }
    }

    private func endEditing() {
        focus = .page
    }

    /// On leaving the field, an empty or zero count becomes 1.
    private func commitTrials() {
        let count = max(Int(trialsText) ?? 0, Rules.trialCounts.lowerBound)
        trials = count
        trialsText = String(count)
    }

    private func start() {
        // In the web version, clicking Start blurred the field first, committing it.
        if focus == .trials { commitTrials() }
        onStart()
    }
}

/// Feedback and the theme, in the popover from the settings button.
private struct SettingsPanel: View {
    @AppStorage(SettingsKey.feedback) private var feedback = true
    @AppStorage(SettingsKey.theme) private var theme = ThemePreference.system

    var body: some View {
        Grid(alignment: .leading, horizontalSpacing: 16, verticalSpacing: 12) {
            GridRow {
                label("FEEDBACK")
                SegmentedPicker(options: [(true, "On"), (false, "Off")], selection: $feedback)
            }
            GridRow {
                label("THEME")
                SegmentedPicker(options: ThemePreference.allCases.map { ($0, $0.label) }, selection: $theme)
            }
        }
        .padding(20)
        .foregroundStyle(Palette.foreground)
        // Opaque, because the popover can hang past the window's edge, and glass there would
        // take on whatever window is beside it.
        .presentationBackground(Palette.background)
        .onChange(of: theme) { _, theme in theme.apply() }
    }

    private func label(_ text: LocalizedStringKey) -> some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .tracking(0.65)
            .opacity(0.7)
    }
}

/// The triangles that step the n-back level. Their hit area is larger than the drawing.
private struct ArrowButton: View {
    let pointsUp: Bool
    let action: () -> Void
    @State private var isHovered = false

    var body: some View {
        Button(action: action) {
            Triangle(pointsUp: pointsUp)
                .fill(Palette.foreground)
                .frame(width: 24, height: 20)
                .opacity(isHovered ? 0.7 : 1)
                .frame(width: 44, height: 40)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { isHovered = $0 }
        .animation(.cssEase(0.15), value: isHovered)
    }
}

nonisolated struct Triangle: Shape {
    var pointsUp: Bool

    func path(in rect: CGRect) -> Path {
        var path = Path()
        if pointsUp {
            path.move(to: CGPoint(x: rect.midX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
            path.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        } else {
            path.move(to: CGPoint(x: rect.minX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
            path.addLine(to: CGPoint(x: rect.midX, y: rect.maxY))
        }
        path.closeSubpath()
        return path
    }
}
