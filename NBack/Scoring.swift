/// Responses in one modality. Each trial lands in exactly one cell.
struct ConfusionMatrix: Equatable {
    /// Match, responded.
    var tp = 0
    /// No match, no response.
    var tn = 0
    /// No match, responded.
    var fp = 0
    /// Match, no response.
    var fn = 0

    mutating func record(match: Bool, responded: Bool) {
        switch (match, responded) {
        case (true, true): tp += 1
        case (true, false): fn += 1
        case (false, true): fp += 1
        case (false, false): tn += 1
        }
    }

    /// TP / (TP + FP + FN) in hundredths of a percent. Correct rejections don't count,
    /// and with nothing to get wrong the score is 100%.
    var score: Int {
        if tp > 0 { return Percent.hundredths(Double(tp) / Double(tp + fp + fn) * 100) }
        return fp > 0 || fn > 0 ? 0 : 10_000
    }
}

/// Scores for a game in progress or a finished one.
struct ScoreSheet: Equatable {
    var trials = 0
    var spatial = ConfusionMatrix()
    var auditory = ConfusionMatrix()
    var elapsedMs = 0

    /// The headline score: the mean of the two modalities, in hundredths of a percent.
    var total: Int {
        Percent.mean(spatial.score, auditory.score)
    }
}

/// Percentages are kept as whole hundredths, so 87.5% is 8750.
enum Percent {
    /// `x` rounded to hundredths the way JavaScript's `x.toFixed(2)` rounds: from the exact
    /// binary value of the double, with exact ties going up. `String(format: "%.2f")` sends
    /// those ties to even instead, so a 1-in-32 hit rate (3.125%) would read 3.12, not 3.13.
    static func hundredths(_ x: Double) -> Int {
        precondition(x >= 0 && x < 1e15, "expected a percentage")
        guard x > 0 else { return 0 }
        // x is exactly m * 2^e with integer m, and e is negative for any x below 2^52.
        let m = x.isNormal ? x.significandBitPattern | (1 << 52) : x.significandBitPattern
        let shift = 52 - (x.isNormal ? Int(x.exponent) : -1022)
        if shift >= 64 { return 0 }  // x * 100 < 0.5
        return Int((m * 100 + (1 << (shift - 1))) >> shift)
    }

    /// The mean of two percentages, computed as the web version did: each score as a double,
    /// averaged, then rounded with `toFixed(2)`.
    static func mean(_ a: Int, _ b: Int) -> Int {
        hundredths((Double(a) / 100 + Double(b) / 100) / 2)
    }

    /// "87.50", for places the web version printed `toFixed(2)`.
    static func fixed(_ hundredths: Int) -> String {
        let fraction = hundredths % 100
        return "\(hundredths / 100).\(fraction < 10 ? "0" : "")\(fraction)"
    }

    /// "87.5", "100", "66.67": how JavaScript prints `Number(x.toFixed(2))`.
    static func trimmed(_ hundredths: Int) -> String {
        let whole = hundredths / 100, fraction = hundredths % 100
        if fraction == 0 { return "\(whole)" }
        if fraction % 10 == 0 { return "\(whole).\(fraction / 10)" }
        return "\(whole).\(fraction < 10 ? "0" : "")\(fraction)"
    }
}

enum TimeFormat {
    /// "m:ss.mmm", for the running clock and the results.
    static func elapsed(_ ms: Int) -> String {
        let seconds = ms / 1000
        return "\(seconds / 60):\(pad(seconds % 60, 2)).\(pad(ms % 1000, 3))"
    }

    /// "m:ss" rounded to the second, for the game length on the home screen.
    static func duration(_ ms: Int) -> String {
        let seconds = Int((Double(ms) / 1000).rounded())
        return "\(seconds / 60):\(pad(seconds % 60, 2))"
    }

    private static func pad(_ value: Int, _ width: Int) -> String {
        let digits = String(value)
        return String(repeating: "0", count: max(0, width - digits.count)) + digits
    }
}
