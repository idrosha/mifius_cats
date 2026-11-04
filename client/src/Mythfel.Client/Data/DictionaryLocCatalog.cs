namespace Mythfel.Client.Data;

public sealed class DictionaryLocCatalog : ILocCatalog
{
    private static readonly HashSet<string> Allowed = new(StringComparer.Ordinal)
    {
        "ru",
        "en",
    };

    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> _entries;

    public string CurrentLocale { get; private set; }

    public DictionaryLocCatalog(
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> entries,
        string initialLocale = "ru")
    {
        _entries = entries ?? throw new ArgumentNullException(nameof(entries));
        CurrentLocale = Normalize(initialLocale);
    }

    public void SetLocale(string locale) => CurrentLocale = Normalize(locale);

    public string Resolve(string nameKey)
    {
        if (string.IsNullOrEmpty(nameKey)) return "";
        if (_entries.TryGetValue(nameKey, out var locales))
        {
            if (locales.TryGetValue(CurrentLocale, out var text) && !string.IsNullOrEmpty(text))
                return text;
            if (locales.TryGetValue("en", out var en) && !string.IsNullOrEmpty(en))
                return en;
        }
        return nameKey;
    }

    private static string Normalize(string locale)
    {
        if (string.IsNullOrWhiteSpace(locale))
            throw new ArgumentException("locale required", nameof(locale));
        var code = locale.Trim().ToLowerInvariant();
        if (!Allowed.Contains(code))
            throw new ArgumentOutOfRangeException(nameof(locale), locale, "SL locales: ru|en only (§1 / §13.8).");
        return code;
    }
}
