// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Game2048Leaderboard
/// @notice Classic and UTC-daily top-10 leaderboards for a 2048 game.
/// @dev Scores are client-reported: this contract cannot verify gameplay or prevent
///      fabricated scores. MAX_SCORE is only a sanity cap. Daily submissions are
///      limited per wallet, not per person; using multiple wallets is possible.
///      Equal scores retain submission order, with earlier entries ranked above.
contract Game2048Leaderboard {
    struct Entry {
        address player;
        uint32 score;
    }

    uint32 public constant MAX_SCORE = 4_000_000;

    mapping(address => uint32) public classicBest;
    Entry[10] public classicTop;
    uint8 public classicCount;

    mapping(uint32 day => mapping(address => bool)) public dailySubmitted;
    mapping(uint32 day => mapping(address => uint32)) public dailyScoreOf;
    mapping(uint32 day => Entry[10]) public dailyTop;
    mapping(uint32 day => uint8) public dailyCount;

    error InvalidScore();
    error NotPersonalBest();
    error InvalidDay();
    error AlreadySubmitted();

    event ClassicScoreSubmitted(address indexed player, uint32 score);
    event DailyScoreSubmitted(address indexed player, uint32 indexed day, uint32 score);

    /// @notice Record a strictly improved, client-reported classic score.
    function submitClassic(uint32 score) external {
        _validateScore(score);
        if (score <= classicBest[msg.sender]) revert NotPersonalBest();
        classicBest[msg.sender] = score;

        uint8 count = classicCount;
        // Remove an existing entry before reinserting the new personal best.
        for (uint8 i = 0; i < count; ++i) {
            if (classicTop[i].player == msg.sender) {
                for (uint8 j = i; j + 1 < count; ++j) {
                    classicTop[j] = classicTop[j + 1];
                }
                --count;
                delete classicTop[count];
                break;
            }
        }

        classicCount = _insert(classicTop, count, msg.sender, score);
        emit ClassicScoreSubmitted(msg.sender, score);
    }

    /// @notice Submit once for today or yesterday (one UTC-day grace period).
    /// @dev No gameplay or game-start timestamp is verified. A submission is final
    ///      for that wallet and day, even if its score does not enter the top 10.
    function submitDaily(uint32 day, uint32 score) external {
        _validateScore(score);
        uint32 today = currentDay();
        if (day != today && (today == 0 || day != today - 1)) revert InvalidDay();
        if (dailySubmitted[day][msg.sender]) revert AlreadySubmitted();

        dailySubmitted[day][msg.sender] = true;
        dailyScoreOf[day][msg.sender] = score;
        dailyCount[day] = _insert(dailyTop[day], dailyCount[day], msg.sender, score);
        emit DailyScoreSubmitted(msg.sender, day, score);
    }

    /// @notice Return the current UTC day index, measured from the Unix epoch.
    function currentDay() public view returns (uint32) {
        return uint32(block.timestamp / 1 days);
    }

    /// @notice Return only populated classic entries, highest score first.
    function getClassicTop() external view returns (address[] memory players, uint32[] memory scores) {
        return _readTop(classicTop, classicCount);
    }

    /// @notice Return only populated entries for a UTC day, highest score first.
    function getDailyTop(uint32 day) external view returns (address[] memory players, uint32[] memory scores) {
        return _readTop(dailyTop[day], dailyCount[day]);
    }

    function getPlayerStatus(uint32 day, address player)
        external
        view
        returns (uint32 classicBestScore, bool dailyDone, uint32 dailyScore)
    {
        return (classicBest[player], dailySubmitted[day][player], dailyScoreOf[day][player]);
    }

    function _validateScore(uint32 score) private pure {
        if (score == 0 || score > MAX_SCORE) revert InvalidScore();
    }

    /// @dev Caller ensures uniqueness. At most ten entries are scanned or moved.
    ///      Strictly greater scores insert before existing entries; ties go after.
    function _insert(Entry[10] storage top, uint8 count, address player, uint32 score)
        private
        returns (uint8)
    {
        if (count == 10 && score <= top[9].score) return count;

        uint8 position;
        while (position < count && top[position].score >= score) {
            ++position;
        }

        uint8 newCount = count < 10 ? count + 1 : count;
        for (uint8 i = newCount - 1; i > position; --i) {
            top[i] = top[i - 1];
        }
        top[position] = Entry({player: player, score: score});
        return newCount;
    }

    function _readTop(Entry[10] storage top, uint8 count)
        private
        view
        returns (address[] memory players, uint32[] memory scores)
    {
        players = new address[](count);
        scores = new uint32[](count);
        for (uint8 i = 0; i < count; ++i) {
            players[i] = top[i].player;
            scores[i] = top[i].score;
        }
    }
}
