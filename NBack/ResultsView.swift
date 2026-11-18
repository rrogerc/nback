import SwiftUI

struct ResultsView: View {
    let sheet: ScoreSheet
    let level: Int
    let onReturnHome: () -> Void

    /// The smallest window area the results lay out in before they scale down to fit.
    private static let designSize = CGSize(width: 680, height: 740)

    var body: some View {
        GeometryReader { proxy in
            results.scaled(fitScale(proxy.size, minimum: Self.designSize), into: proxy.size)
        }
    }

    private var results: some View {
        VStack(spacing: 30) {
            VStack(spacing: 5) {
                Text(verbatim: "\(Percent.fixed(sheet.total))%")
                    .font(.system(size: 60, weight: .bold))
                    .tracking(-1.8)
                    .foregroundStyle(Palette.yellow)
                Text(verbatim: "\(level)-Back Score")
                    .font(.system(size: 18, weight: .semibold))
                    .opacity(0.6)
            }
            ScoreTables(sheet: sheet, level: level)
            Button("Return Home", action: onReturnHome)
                .buttonStyle(OutlineButtonStyle(fontSize: 20, paddingV: 12, paddingH: 40))
        }
        .frame(maxWidth: 600)
        .padding(.vertical, 20)
        .padding(.horizontal, 40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// The Stimulus-Response breakdown and the speed, trials, and time table.
private struct ScoreTables: View {
    let sheet: ScoreSheet
    let level: Int

    var body: some View {
        let spatial = sheet.spatial, auditory = sheet.auditory
        let falsePositives = spatial.fp + auditory.fp
        let trueNegatives = spatial.tn + auditory.tn
        VStack(spacing: 0) {
            Text("Stimulus\(Text("-").foregroundStyle(Palette.yellow))Response")
                .font(.system(size: 32, weight: .bold))
                .tracking(-0.64)
                .padding(15)
                .padding(.bottom, 15)

            // Column widths the browser chose for the original table at its 600 pt width,
            // where "No Response" and the other long labels wrap to two lines.
            ScoreTable(columnWidths: [115, 118, 122, 81, 80, 84], rows: [
                [.header(Text("\(level)\(Text("-").foregroundStyle(Palette.yellow))Back")),
                 .header("Response"), .header("No Response"), .header("False +"),
                 .header("Trials"), .header("Score")],
                [.header("Spatial"),
                 .value(spatial.tp, Palette.green), .value(spatial.fn, Palette.red),
                 .value(spatial.fp, Palette.red), .value(spatial.tp + spatial.fn),
                 .value(Percent.trimmed(spatial.score) + "%", Palette.green)],
                [.header("Auditory"),
                 .value(auditory.tp, Palette.green), .value(auditory.fn, Palette.red),
                 .value(auditory.fp, Palette.red), .value(auditory.tp + auditory.fn),
                 .value(Percent.trimmed(auditory.score) + "%", Palette.green)],
                [.header("No Stimulus"),
                 .value(falsePositives, Palette.red), .value(trueNegatives), .value("-"),
                 .value(falsePositives + trueNegatives), .value("-")],
                [.header("Total Stimulus"),
                 .value(spatial.tp + auditory.tp + falsePositives),
                 .value(spatial.fn + auditory.fn + trueNegatives),
                 .value(falsePositives), .value(sheet.trials),
                 .value(Percent.trimmed(sheet.total) + "%", Palette.yellow)],
            ])

            // The <br> between the tables.
            Spacer().frame(height: 12)

            ScoreTable(columnWidths: [190, 173, 237], rows: [
                [.header("Speed"), .header("Trials"), .header("Time")],
                [.value("\(Rules.trialMs / 1000)s"), .value(sheet.trials),
                 .value(TimeFormat.elapsed(sheet.elapsedMs), Palette.blue)],
            ])
        }
    }
}

private struct TableCell {
    let text: Text
    let isHeader: Bool

    static func header(_ text: Text) -> TableCell { TableCell(text: text, isHeader: true) }
    static func header(_ label: String) -> TableCell { header(Text(verbatim: label)) }

    static func value(_ value: String, _ color: Color? = nil) -> TableCell {
        let text = Text(verbatim: value)
        return TableCell(text: color.map { text.foregroundStyle($0) } ?? text, isHeader: false)
    }

    static func value(_ number: Int, _ color: Color? = nil) -> TableCell {
        value(String(number), color)
    }
}

/// A table with collapsed 1 pt rules, columns at fixed proportions, and every cell in a row
/// as tall as the tallest.
private struct ScoreTable: View {
    let columnWidths: [CGFloat]
    let rows: [[TableCell]]

    var body: some View {
        VStack(spacing: 0) {
            ForEach(rows.indices, id: \.self) { row in
                ProportionalRow(weights: columnWidths) {
                    ForEach(rows[row].indices, id: \.self) { column in
                        let cell = rows[row][column]
                        cell.text
                            .font(.system(size: 18, weight: cell.isHeader ? .semibold : .regular))
                            .multilineTextAlignment(.center)
                            .padding(.vertical, 12)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                            // Each cell draws its top and left rules; the table adds the
                            // bottom and right ones.
                            .overlay(alignment: .top) { Palette.rule.frame(height: 1) }
                            .overlay(alignment: .leading) { Palette.rule.frame(width: 1) }
                    }
                }
            }
        }
        .overlay(alignment: .bottom) { Palette.rule.frame(height: 1) }
        .overlay(alignment: .trailing) { Palette.rule.frame(width: 1) }
    }
}

/// Places its subviews side by side, splitting the width in proportion to `weights`.
private struct ProportionalRow: Layout {
    let weights: [CGFloat]

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? weights.reduce(0, +)
        let widths = columnWidths(total: width)
        let height = subviews.indices
            .map { subviews[$0].sizeThatFits(ProposedViewSize(width: widths[$0], height: nil)).height }
            .max() ?? 0
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let widths = columnWidths(total: bounds.width)
        var x = bounds.minX
        for index in subviews.indices {
            subviews[index].place(
                at: CGPoint(x: x, y: bounds.minY),
                proposal: ProposedViewSize(width: widths[index], height: bounds.height))
            x += widths[index]
        }
    }

    private func columnWidths(total: CGFloat) -> [CGFloat] {
        let sum = weights.reduce(0, +)
        return weights.map { total * $0 / sum }
    }
}
