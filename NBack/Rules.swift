/// The game's rules and timing, unchanged from the web version.
enum Rules {
    /// One trial every 3 seconds.
    static let trialMs = 3000
    /// The position stays lit for the first half of its trial.
    static let stimulusMs = trialMs / 2
    /// Eight outer cells of the 3x3 grid, and eight letter sounds.
    static let stimulusCount = 8

    static let defaultLevel = 2
    static let defaultTrials = 40
    static let levels = 1...99
    static let trialCounts = 1...999

    /// A game waits one interval before the first stimulus, then runs one interval per trial.
    static func gameDurationMs(trials: Int) -> Int {
        (trials + 1) * trialMs
    }
}
