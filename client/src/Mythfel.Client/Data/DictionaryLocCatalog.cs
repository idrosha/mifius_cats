namespace Mythfel.Client.Data;

public sealed class DictionaryLocCatalog : ILocCatalog
{
    private readonly IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> _entries;

    public DictionaryLocCatalog(IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> entries)
    {
        _entries = entries ?? throw new ArgumentNullException(nameof(entries));
    }

    public string Resolve(string nameKey, string locale = "ru")
    {
        if (string.IsNullOrEmpty(nameKey)) return "";
        if (_entries.TryGetValue(nameKey, out var locales))
        {
            if (locales.TryGetValue(locale, out var text) && !string.IsNullOrEmpty(text))
                return text;
            if (locales.TryGetValue("en", out var en) && !string.IsNullOrEmpty(en))
                return en;
        }
        return nameKey;
    }
}
