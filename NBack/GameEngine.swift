import Foundation
import Observation

enum Modality {
    case position, sound
}

/// One game: the trial loop, responses, pause, and scoring.
///
/// Trials fall on a fixed schedule of play time, which is time not spent paused. Stimulus k
/// appears at k × 3 s and its cell goes dark 1.5 s later, so the first one comes after a
/// lead-in of one interval. At (trials + 1) × 3 s the last trial is scored and the game ends.
/// Pausing stops play time and resuming reschedules from it, so a trial picks up exactly
/// where it stopped.
@Observable
final class GameEngine {
    let settings: GameSettings

    /// The lit grid cell, numbered 1 to 8 left to right and top to bottom, skipping the
    /// center. 0 when no cell is lit.
    private(set) var litCell = 0
    /// Stimuli shown so far, including the current one.
    private(set) var trialsShown = 0
    private(set) var isPaused = false
    /// Responses this trial, which light the buttons until the next trial starts.
    private(set) var positionPressed = false
    private(set) var soundPressed = false
    /// Whether the current trial is a match, which colors a pressed button green or red.
    private(set) var positionMatch = false
    private(set) var soundMatch = false
    /// Scores for the trials completed so far.
    private(set) var liveScore = ScoreSheet()

    @ObservationIgnored var onFinish: ((ScoreSheet) -> Void)?

    @ObservationIgnored private let sounds: SoundBank
    @ObservationIgnored private var positionResponded = false
    @ObservationIgnored private var soundResponded = false
    // Newest first and at most level + 1 long, so the last item is the one n trials back.
    @ObservationIgnored private var recentCells: [Int] = []
    @ObservationIgnored private var recentLetters: [Int] = []
    @ObservationIgnored private var spatial = ConfusionMatrix()
    @ObservationIgnored private var auditory = ConfusionMatrix()

    @ObservationIgnored private let clock = ContinuousClock()
    @ObservationIgnored private var startedAt: ContinuousClock.Instant?
    @ObservationIgnored private var pausedAt: ContinuousClock.Instant?
    @ObservationIgnored private var pausedTotal = Duration.zero
    @ObservationIgnored private var loop: Task<Void, Never>?
    @ObservationIgnored private var activity: (any NSObjectProtocol)?
    @ObservationIgnored private var isOver = false

    init(settings: GameSettings, sounds: SoundBank) {
        self.settings = settings
        self.sounds = sounds
    }

    func start() {
        guard startedAt == nil else { return }
        startedAt = clock.now
        // Keeps the display awake, and keeps App Nap from stretching the timers if the
        // window is covered.
        activity = ProcessInfo.processInfo.beginActivity(
            options: [.userInitiated, .idleDisplaySleepDisabled],
            reason: "Dual N-Back game in progress")
        scheduleEvents()
    }

    /// Ends the game without results, as Quit does.
    func stop() {
        isOver = true
        loop?.cancel()
        loop = nil
        if let activity {
            ProcessInfo.processInfo.endActivity(activity)
            self.activity = nil
        }
    }

    func togglePause() {
        guard !isOver, startedAt != nil else { return }
        if let pausedAt {
            pausedTotal += clock.now - pausedAt
            self.pausedAt = nil
            isPaused = false
            scheduleEvents()
        } else {
            pausedAt = clock.now
            isPaused = true
            loop?.cancel()
            loop = nil
        }
    }

    /// Records a match response for the current trial. A response during the lead-in
    /// lights its button but scores nothing.
    func respond(_ modality: Modality) {
        guard !isPaused, !isOver else { return }
        switch modality {
        case .position:
            positionResponded = true
            positionPressed = true
        case .sound:
            soundResponded = true
            soundPressed = true
        }
    }

    /// Play time in milliseconds. It stands still while paused.
    func elapsedMs() -> Int {
        guard let startedAt else { return 0 }
        return ((pausedAt ?? clock.now) - startedAt - pausedTotal).wholeMilliseconds
    }

    // MARK: - Trial loop

    private enum Event {
        case hideCell, nextTrial
    }

    private struct Scheduled {
        let deadline: ContinuousClock.Instant
        let event: Event
    }

    private func scheduleEvents() {
        loop = Task { [weak self] in
            while let next = self?.nextEvent() {
                try? await Task.sleep(until: next.deadline, tolerance: .milliseconds(1), clock: .continuous)
                guard !Task.isCancelled, let self else { return }
                switch next.event {
                case .hideCell: litCell = 0
                case .nextTrial: advance()
                }
            }
        }
    }

    private func nextEvent() -> Scheduled? {
        guard !isOver, let startedAt else { return nil }
        let origin = startedAt + pausedTotal
        if litCell != 0 {
            let hideAt = trialsShown * Rules.trialMs + Rules.stimulusMs
            return Scheduled(deadline: origin + .milliseconds(hideAt), event: .hideCell)
        }
        let trialAt = (trialsShown + 1) * Rules.trialMs
        return Scheduled(deadline: origin + .milliseconds(trialAt), event: .nextTrial)
    }

    /// Scores the trial that just ended, then shows the next stimulus or finishes.
    private func advance() {
        positionPressed = false
        soundPressed = false
        if trialsShown > 0 {
            spatial.record(match: positionMatch, responded: positionResponded)
            auditory.record(match: soundMatch, responded: soundResponded)
            liveScore = ScoreSheet(
                trials: trialsShown, spatial: spatial, auditory: auditory, elapsedMs: elapsedMs())
        }
        positionResponded = false
        soundResponded = false

        guard trialsShown < settings.trials else {
            finish()
            return
        }

        let cell = Int.random(in: 1...Rules.stimulusCount)
        let letter = Int.random(in: 1...Rules.stimulusCount)
        litCell = cell
        sounds.play(letter)
        recentCells.insert(cell, at: 0)
        recentLetters.insert(letter, at: 0)
        positionMatch = isNBackMatch(recentCells)
        soundMatch = isNBackMatch(recentLetters)
        if recentCells.count > settings.level {
            recentCells.removeLast()
            recentLetters.removeLast()
        }
        trialsShown += 1
    }

    /// Whether the newest stimulus equals the one n trials back, which is the oldest kept.
    private func isNBackMatch(_ recent: [Int]) -> Bool {
        recent.count > settings.level && recent.first == recent.last
    }

    private func finish() {
        let sheet = ScoreSheet(
            trials: trialsShown, spatial: spatial, auditory: auditory, elapsedMs: elapsedMs())
        stop()
        onFinish?(sheet)
    }
}

private extension Duration {
    var wholeMilliseconds: Int {
        let (seconds, attoseconds) = components
        return Int(seconds) * 1000 + Int(attoseconds / 1_000_000_000_000_000)
    }
}
