namespace Mythfel.Client.Meta;

public sealed class HubViewState
{
    public HubTabId ActiveTab { get; init; }
    public IReadOnlyList<HubTabView> Tabs { get; init; } = Array.Empty<HubTabView>();

    /// <summary>When set, Hub shows Soon placeholder instead of real content.</summary>
    public SoonSheetId? ActiveSoonSheet { get; init; }

    public string? SoonTitleKey { get; init; }
    public string? SoonTitle { get; init; }
    public string? SoonBodyKey { get; init; }
    public string? SoonBody { get; init; }
}

public sealed class HubTabView
{
    public HubTabId Id { get; init; }
    public string NameKey { get; init; } = "";
    public string DisplayName { get; init; } = "";

    /// <summary>True when tab is «Скоро» stub (§1 / feature_flags).</summary>
    public bool IsSoon { get; init; }
}
