namespace Mythfel.Client.Data;

/// <summary>
/// Localization via keys (§9). Never hardcode RU strings in presenter.
/// </summary>
public interface ILocCatalog
{
    string Resolve(string nameKey, string locale = "ru");
}
