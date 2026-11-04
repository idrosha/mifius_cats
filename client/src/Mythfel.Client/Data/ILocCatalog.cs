namespace Mythfel.Client.Data;

/// <summary>
/// Localization via keys (§9). Never hardcode RU strings in presenter.
/// Soft launch: RU+EN only (§1 MUST / §13.8).
/// </summary>
public interface ILocCatalog
{
    /// <summary>Active locale code: <c>ru</c> or <c>en</c>.</summary>
    string CurrentLocale { get; }

    /// <summary>Switch active locale (§13.8). Only <c>ru</c>/<c>en</c>.</summary>
    void SetLocale(string locale);

    string Resolve(string nameKey);
}
