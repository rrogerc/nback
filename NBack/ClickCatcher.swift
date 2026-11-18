import AppKit
import SwiftUI

enum MouseButton {
    case left, right
}

/// Reports mouse-downs anywhere in its frame, located in its own top-left coordinates.
/// SwiftUI has no right-click gesture and fires taps on mouse-up, but a response should
/// count the moment the button goes down, as the web version's `mousedown` listener did.
struct ClickCatcher: NSViewRepresentable {
    var onMouseDown: (CGPoint, MouseButton) -> Void

    func makeNSView(context: Context) -> CatcherView {
        CatcherView()
    }

    func updateNSView(_ view: CatcherView, context: Context) {
        view.onMouseDown = onMouseDown
    }

    final class CatcherView: NSView {
        var onMouseDown: ((CGPoint, MouseButton) -> Void)?

        override var isFlipped: Bool { true }
        override var mouseDownCanMoveWindow: Bool { false }

        // A click on an inactive window still counts, as it does in a browser.
        override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }

        override func mouseDown(with event: NSEvent) {
            // Control-click is the Mac's right-click.
            report(event, event.modifierFlags.contains(.control) ? .right : .left)
        }

        override func rightMouseDown(with event: NSEvent) {
            report(event, .right)
        }

        private func report(_ event: NSEvent, _ button: MouseButton) {
            onMouseDown?(convert(event.locationInWindow, from: nil), button)
        }
    }
}
