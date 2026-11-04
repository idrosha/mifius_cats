using Mythfel.Client.Battle;
using Mythfel.Client.Data;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class BattlePresenterTests
{
    [Fact]
    public void ApplyStateDiff_binds_board_hand_energy_milk_without_local_damage_math()
    {
        var view = new CaptureHud();
        var loc = new DictionaryLocCatalog(new Dictionary<string, IReadOnlyDictionary<string, string>>
        {
            ["card.tank_stone_muzzle"] = new Dictionary<string, string>
            {
                ["ru"] = "Каменный оскал",
                ["en"] = "Stone Snarl",
            },
        });
        var net = new StubBattleNetClient();
        var presenter = new BattlePresenter(net, loc, view);

        presenter.ApplyStateDiff(SampleDiff(seq: 1, p1Energy: 2, allyHp: 40));

        Assert.Equal(1, view.Last!.Seq);
        Assert.Equal(2, view.Last.Energy);
        Assert.Equal(1, view.Last.MilkDrops);
        Assert.Equal(3, view.Last.AllyBoard.Count);
        Assert.Equal(3, view.Last.EnemyBoard.Count);
        Assert.Equal(40, view.Last.AllyBoard[0].Hp);
        Assert.Single(view.Last.Hand);
        Assert.Equal("Каменный оскал", view.Last.Hand[0].DisplayName);
        Assert.Equal("card.tank_stone_muzzle", view.Last.Hand[0].NameKey);
        Assert.True(view.Last.CanEndTurn);
        Assert.Empty(view.Last.Result);
    }

    [Fact]
    public async Task SubmitAsync_applies_server_stateDiff_hp_as_authoritative()
    {
        var view = new CaptureHud();
        var loc = new DictionaryLocCatalog(new Dictionary<string, IReadOnlyDictionary<string, string>>());
        var net = new StubBattleNetClient();
        var presenter = new BattlePresenter(net, loc, view);

        presenter.ApplyStateDiff(SampleDiff(seq: 1, p1Energy: 2, allyHp: 40));
        // Server says HP dropped to 28 — presenter must show 28, not invent formula.
        net.Enqueue(SampleDiff(seq: 2, p1Energy: 1, allyHp: 28));

        await presenter.SubmitAsync(BattleAction.PlayCard("p1_0", 0));

        Assert.Equal(2, view.Last!.Seq);
        Assert.Equal(28, view.Last.AllyBoard[0].Hp);
        Assert.Equal(1, view.Last.Energy);
    }

    [Fact]
    public void ApplyStateDiff_finished_disables_end_turn()
    {
        var view = new CaptureHud();
        var presenter = new BattlePresenter(
            new StubBattleNetClient(),
            new DictionaryLocCatalog(new Dictionary<string, IReadOnlyDictionary<string, string>>()),
            view);

        var diff = SampleDiff(seq: 9, p1Energy: 0, allyHp: 10);
        // mutate via new instance with result
        diff = new StateDiff
        {
            BattleId = diff.BattleId,
            Seq = 9,
            Turn = 4,
            Active = 0,
            Result = "p1_win",
            P1 = diff.P1,
            P2 = diff.P2,
            Units = diff.Units,
            Hand = Array.Empty<HandCardDiff>(),
            PotionTray = diff.PotionTray,
            CanKeep = false,
            CanEndTurn = false,
        };

        presenter.ApplyStateDiff(diff);

        Assert.True(view.Last!.IsFinished);
        Assert.False(view.Last.CanEndTurn);
        Assert.Equal("p1_win", view.Last.Result);
    }

    private static StateDiff SampleDiff(int seq, int p1Energy, int allyHp) => new()
    {
        BattleId = "b_test",
        Seq = seq,
        Turn = 1,
        Active = 0,
        Result = "",
        P1 = new PlayerDiff { Energy = p1Energy, MilkDrops = 1, MilkBursts = 0, KeepCost = 1 },
        P2 = new PlayerDiff { Energy = 2, MilkDrops = 0, MilkBursts = 0, KeepCost = 1 },
        Units = new[]
        {
            Unit("p1_0", side: 0, lane: 0, allyHp),
            Unit("p1_1", side: 0, lane: 1, 35),
            Unit("p1_2", side: 0, lane: 2, 30),
            Unit("p2_0", side: 1, lane: 0, 25),
            Unit("p2_1", side: 1, lane: 1, 25),
            Unit("p2_2", side: 1, lane: 2, 25),
        },
        Hand = new[]
        {
            new HandCardDiff
            {
                UnitId = "p1_0",
                HandIndex = 0,
                CardId = "card_tank_stone_muzzle",
                NameKey = "card.tank_stone_muzzle",
                Cost = 1,
                Playable = p1Energy >= 1,
            },
        },
        PotionTray = Array.Empty<PotionSlotDiff>(),
        CanKeep = true,
        CanEndTurn = true,
    };

    private static UnitDiff Unit(string id, int side, int lane, int hp) => new()
    {
        Id = id,
        Side = side,
        Lane = lane,
        Role = side == 0 ? "tank" : "fighter",
        Element = side == 0 ? "stone" : "fire",
        Hp = hp,
        MaxHp = 40,
        Shield = 0,
        Alive = hp > 0,
        Statuses = Array.Empty<StatusDiff>(),
        HandCount = side == 0 ? 1 : 0,
    };

    private sealed class CaptureHud : IBattleHudView
    {
        public BattleViewState? Last { get; private set; }
        public void Render(BattleViewState state) => Last = state;
    }
}
