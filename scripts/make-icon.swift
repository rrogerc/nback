// Draws the app icon: the in-game clock (ring, yellow left quarter, hand pointing left)
// on the dark theme background, at every size a macOS app icon set needs.
//
//     swift scripts/make-icon.swift NBack/Assets.xcassets/AppIcon.appiconset
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

let outDir = CommandLine.arguments[1]

func color(_ hex: UInt32) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 0xff) / 255, green: CGFloat((hex >> 8) & 0xff) / 255,
            blue: CGFloat(hex & 0xff) / 255, alpha: 1)
}

func draw(in ctx: CGContext) {
    // Apple's macOS icon grid: an 824 pt rounded square centered on a 1024 pt canvas.
    let body = CGRect(x: 100, y: 100, width: 824, height: 824)
    ctx.saveGState()
    ctx.setShadow(offset: CGSize(width: 0, height: -10), blur: 20, color: CGColor(gray: 0, alpha: 0.3))
    ctx.addPath(CGPath(roundedRect: body, cornerWidth: 185, cornerHeight: 185, transform: nil))
    ctx.setFillColor(color(0x1f2329))
    ctx.fillPath()
    ctx.restoreGState()

    let center = CGPoint(x: 512, y: 512)
    let outer: CGFloat = 270
    let width: CGFloat = 36
    let mid = outer - width / 2
    ctx.setLineWidth(width)
    ctx.setStrokeColor(color(0xe0e2e7))
    ctx.addArc(center: center, radius: mid, startAngle: 0, endAngle: .pi * 2, clockwise: false)
    ctx.strokePath()
    ctx.setStrokeColor(color(0xf0b429))
    ctx.addArc(center: center, radius: mid, startAngle: .pi * 0.75, endAngle: .pi * 1.25, clockwise: false)
    ctx.strokePath()

    // The hand: a needle from the center toward 9 o'clock, as in the original logo.
    let length = (outer - width) * 0.82
    let base: CGFloat = 22
    ctx.setFillColor(color(0xe0e2e7))
    ctx.move(to: CGPoint(x: center.x - length, y: center.y))
    ctx.addLine(to: CGPoint(x: center.x, y: center.y + base))
    ctx.addArc(center: center, radius: base, startAngle: .pi / 2, endAngle: -.pi / 2, clockwise: true)
    ctx.closePath()
    ctx.fillPath()
}

let sizes: [(String, Int)] = [
    ("icon_16x16", 16), ("icon_16x16@2x", 32), ("icon_32x32", 32), ("icon_32x32@2x", 64),
    ("icon_128x128", 128), ("icon_128x128@2x", 256), ("icon_256x256", 256),
    ("icon_256x256@2x", 512), ("icon_512x512", 512), ("icon_512x512@2x", 1024),
]

for (name, pixels) in sizes {
    let ctx = CGContext(data: nil, width: pixels, height: pixels, bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!,
                        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.interpolationQuality = .high
    ctx.scaleBy(x: CGFloat(pixels) / 1024, y: CGFloat(pixels) / 1024)
    draw(in: ctx)
    let url = URL(fileURLWithPath: "\(outDir)/\(name).png")
    let dest = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(dest, ctx.makeImage()!, nil)
    CGImageDestinationFinalize(dest)
}
print("wrote \(sizes.count) icons to \(outDir)")
