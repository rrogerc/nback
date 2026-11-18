import AVFoundation

/// The eight letter sounds, loaded once at launch and reused by every game.
final class SoundBank {
    private var players: [Int: AVAudioPlayer] = [:]

    init(bundle: Bundle = .main) {
        for (index, letter) in ["h", "j", "k", "l", "q", "r", "s", "t"].enumerated() {
            // A sound that fails to load is skipped, and its trials play silently.
            guard let url = bundle.url(forResource: letter, withExtension: "wav"),
                  let player = try? AVAudioPlayer(contentsOf: url)
            else { continue }
            player.prepareToPlay()
            players[index + 1] = player
        }
    }

    /// Plays sound 1 to 8 from the beginning.
    func play(_ number: Int) {
        guard let player = players[number] else { return }
        player.currentTime = 0
        player.play()
    }
}
