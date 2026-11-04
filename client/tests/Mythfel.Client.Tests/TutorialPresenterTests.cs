using Mythfel.Client.Battle;
using Mythfel.Client.Data;
using Mythfel.Client.Meta;
using Mythfel.Client.Net;
using Mythfel.Client.UI;

namespace Mythfel.Client.Tests;

public class TutorialPresenterTests
{
    [Fact]
    public async Task Soft_launch_path_starters_yard_victory_under_10_minutes()
    {
        var now = new DateTimeOffset(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
        var view = new CaptureTutorial();
        var net = new StubBattleNetClient();
        net.Enqueue(OpenDiff("tut_yard_1"));
        var presenter = new TutorialPresenter(net, SampleLoc(), view, () => now);

        presenter.Begin();
        Assert.Equal(TutorialStepId.Starters, view.Last!.Step);
        Assert.Equal(TutorialPresenter.SoftLaunchStarters, view.Last.StarterTeam);
        Assert.Equal("starters", view.Last.EmittedTutorialSteps[0]);

        now = now.AddMinutes(3);
        await presenter.StartYardBattleAsync();

        Assert.Equal(TutorialStepId.YardBattle, view.Last!.Step);
        Assert.Equal("test_yard_1", net.LastCreatePvEStageId);
        Assert.Equal(TutorialPresenter.SoftLaunchStarters, net.LastCreatePvETeam);
        Assert.Equal("tut_yard_1", view.Last.BattleId);
        Assert.Contains("yard_battle", view.Last.EmittedTutorialSteps);

        now = now.AddMinutes(4); // total 7 min < 10
        presenter.ApplyBattleResult("p1_win");

        Assert.True(view.Last!.IsComplete);
        Assert.False(view.Last.IsFailed);
        Assert.Equal(TutorialStepId.Victory, view.Last.Step);
        Assert.Equal("p1_win", view.Last.BattleResult);
        Assert.True(view.Last.Elapsed < TutorialPresenter.SoftLaunchBudget);
        Assert.Equal(new[] { "starters", "yard_battle", "victory" }, view.Last.EmittedTutorialSteps.ToArray());
        Assert.Equal("Победа во Дворе", view.Last.StepLabel);
    }

    [Fact]
    public async Task Overtime_marks_failed_not_complete()
    {
        var now = new DateTimeOffset(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
        var view = new CaptureTutorial();
        var net = new StubBattleNetClient();
        net.Enqueue(OpenDiff("slow"));
        var presenter = new TutorialPresenter(net, SampleLoc(), view, () => now);

        presenter.Begin();
        await presenter.StartYardBattleAsync();
        now = now.AddMinutes(11);
        presenter.ApplyBattleResult("p1_win");

        Assert.True(view.Last!.IsFailed);
        Assert.False(view.Last.IsComplete);
        Assert.Equal(TutorialStepId.FailedOvertime, view.Last.Step);
        Assert.Contains("overtime", view.Last.EmittedTutorialSteps);
    }

    [Fact]
    public async Task Non_win_result_does_not_complete()
    {
        var now = new DateTimeOffset(2026, 11, 4, 12, 0, 0, TimeSpan.Zero);
        var view = new CaptureTutorial();
        var net = new StubBattleNetClient();
        net.Enqueue(OpenDiff("loss"));
        var presenter = new TutorialPresenter(net, SampleLoc(), view, () => now);

        presenter.Begin();
        await presenter.StartYardBattleAsync();
        presenter.ApplyStateDiff(new StateDiff
        {
            BattleId = "loss",
            Result = "p2_win",
        });

        Assert.False(view.Last!.IsComplete);
        Assert.Equal(TutorialStepId.YardBattle, view.Last.Step);
        Assert.Equal("p2_win", view.Last.BattleResult);
    }

    [Fact]
    public async Task Begin_required_before_yard()
    {
        var presenter = new TutorialPresenter(new StubBattleNetClient(), SampleLoc(), new CaptureTutorial());
        await Assert.ThrowsAsync<InvalidOperationException>(() => presenter.StartYardBattleAsync());
    }

    private static StateDiff OpenDiff(string battleId) => new()
    {
        BattleId = battleId,
        Seq = 0,
        Turn = 1,
        Active = 0,
        Result = "",
        P1 = new PlayerDiff { Energy = 2 },
        P2 = new PlayerDiff { Energy = 2 },
        Units = Array.Empty<UnitDiff>(),
        Hand = Array.Empty<HandCardDiff>(),
        PotionTray = Array.Empty<PotionSlotDiff>(),
        CanEndTurn = true,
    };

    private static DictionaryLocCatalog SampleLoc() => new(new Dictionary<string, IReadOnlyDictionary<string, string>>
    {
        ["tutorial.step.starters"] = Dict("Три стартовых котика", "Your three starter cats"),
        ["tutorial.step.yard_battle"] = Dict("Бой во Дворе", "Yard battle"),
        ["tutorial.step.victory"] = Dict("Победа во Дворе", "Yard victory"),
        ["tutorial.step.overtime"] = Dict("Дольше 10 минут", "Over 10 minutes"),
    });

    private static IReadOnlyDictionary<string, string> Dict(string ru, string en) =>
        new Dictionary<string, string> { ["ru"] = ru, ["en"] = en };

    private sealed class CaptureTutorial : ITutorialView
    {
        public TutorialViewState? Last { get; private set; }
        public void Render(TutorialViewState state) => Last = state;
    }
}
