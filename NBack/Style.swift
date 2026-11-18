import AppKit
import SwiftUI

/// Colors from the web version's stylesheet. Background and foreground follow the window's
/// light or dark appearance.
enum Palette {
    static let background = Color(nsColor: .adaptive(light: 0xe9e9ea, dark: 0x1f2329))
    static let foreground = Color(nsColor: .adaptive(light: 0x383d43, dark: 0xe0e2e7))
    static let yellow = Color(nsColor: NSColor(hex: 0xf0b429))
    static let red = Color(nsColor: NSColor(hex: 0xef4444))
    static let green = Color(nsColor: NSColor(hex: 0x22c55e))
    static let blue = Color(nsColor: NSColor(hex: 0x3b82f6))
    /// The web version's rgba(128, 128, 128, 0.1) hover tint.
    static let hover = Color(nsColor: NSColor(hex: 0x808080)).opacity(0.1)
    /// rgba(128, 128, 128, 0.25) over the background, made opaque so crossing table rules
    /// don't darken where they overlap.
    static let rule = Color(nsColor: .adaptive(light: 0xcfcfd0, dark: 0x373a3f))
}

private extension NSColor {
    // AppKit can resolve dynamic colors off the main thread, hence nonisolated.
    nonisolated convenience init(hex: UInt32) {
        self.init(
            srgbRed: CGFloat((hex >> 16) & 0xff) / 255,
            green: CGFloat((hex >> 8) & 0xff) / 255,
            blue: CGFloat(hex & 0xff) / 255,
            alpha: 1)
    }

    nonisolated static func adaptive(light: UInt32, dark: UInt32) -> NSColor {
        NSColor(name: nil) { appearance in
            let isDark = appearance.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua
            return NSColor(hex: isDark ? dark : light)
        }
    }
}

/// The scale at which content needing at least `minimum` fits in `size`. Never above 1.
func fitScale(_ size: CGSize, minimum: CGSize) -> CGFloat {
    min(1, size.width / minimum.width, size.height / minimum.height)
}

extension View {
    /// Lays the view out at `size` divided by `scale`, then draws it scaled down into `size`.
    /// A window smaller than a screen's design size, such as a small tile in a tiling window
    /// manager, then shows the whole screen shrunk evenly instead of clipped.
    func scaled(_ scale: CGFloat, into size: CGSize) -> some View {
        frame(width: size.width / scale, height: size.height / scale)
            .scaleEffect(scale, anchor: .topLeading)
            .frame(width: size.width, height: size.height, alignment: .topLeading)
    }
}

extension Animation {
    /// CSS `ease`, the curve of the web version's transitions.
    static func cssEase(_ duration: Double) -> Animation {
        .timingCurve(0.25, 0.1, 0.25, 1, duration: duration)
    }
}

/// The outlined button used throughout: a light tint on hover, inverted colors while pressed.
struct OutlineButtonStyle: ButtonStyle {
    var fontSize: CGFloat = 17
    var paddingV: CGFloat = 12
    var paddingH: CGFloat = 28
    var cornerRadius: CGFloat = 10
    var tracking: CGFloat = 0.5
    /// Opacity when the pointer is elsewhere. The pause button and Quit rest dimmed.
    var restingOpacity: Double = 1

    func makeBody(configuration: Configuration) -> some View {
        OutlineButton(configuration: configuration, style: self)
    }
}

private struct OutlineButton: View {
    let configuration: ButtonStyleConfiguration
    let style: OutlineButtonStyle
    @State private var isHovered = false

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: style.cornerRadius)
        let pressed = configuration.isPressed
        configuration.label
            .font(.system(size: style.fontSize, weight: .semibold))
            .tracking(style.tracking)
            .foregroundStyle(pressed ? Palette.background : Palette.foreground)
            .padding(.vertical, style.paddingV)
            .padding(.horizontal, style.paddingH)
            .background(shape.fill(pressed ? Palette.foreground : isHovered ? Palette.hover : .clear))
            .overlay(shape.strokeBorder(Palette.foreground, lineWidth: 1.5))
            .contentShape(shape)
            .opacity(isHovered ? 1 : style.restingOpacity)
            .onHover { isHovered = $0 }
            .animation(.cssEase(0.15), value: isHovered)
            .animation(.cssEase(0.15), value: pressed)
    }
}

/// A row of outlined options with the selected one filled, for Feedback and the theme.
struct SegmentedPicker<Value: Hashable>: View {
    let options: [(value: Value, label: String)]
    @Binding var selection: Value

    var body: some View {
        HStack(spacing: 0) {
            ForEach(options.indices, id: \.self) { index in
                let option = options[index]
                Button(option.label) { selection = option.value }
                    .buttonStyle(SegmentStyle(isSelected: selection == option.value))
                    .padding(.leading, index > 0 ? 1.5 : 0)
                    .overlay(alignment: .leading) {
                        if index > 0 { Palette.foreground.frame(width: 1.5) }
                    }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 6.5))
        .padding(1.5)
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Palette.foreground, lineWidth: 1.5))
        .fixedSize()
    }
}

private struct SegmentStyle: ButtonStyle {
    let isSelected: Bool

    func makeBody(configuration: Configuration) -> some View {
        Segment(configuration: configuration, isSelected: isSelected)
    }
}

private struct Segment: View {
    let configuration: ButtonStyleConfiguration
    let isSelected: Bool
    @State private var isHovered = false

    var body: some View {
        let filled = isSelected || configuration.isPressed
        configuration.label
            .font(.system(size: 13, weight: .semibold))
            .tracking(0.5)
            .foregroundStyle(filled ? Palette.background : Palette.foreground)
            .padding(.vertical, 8)
            .padding(.horizontal, 14)
            .background(filled ? Palette.foreground : isHovered ? Palette.hover : .clear)
            .contentShape(Rectangle())
            .onHover { isHovered = $0 }
            .animation(.cssEase(0.15), value: filled)
    }
}
