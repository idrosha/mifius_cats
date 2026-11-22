# Кооп-данжи — smoke / acceptance

Канон: `docs/dungeons-coop-3.md`

## Авто

```bash
node qa/gate/dungeon_coop_smoke.mjs
node qa/gate/dungeon_api_smoke.mjs
node qa/gate/dungeon_boss_hp_smoke.mjs
```

## Ручной HUD

1. **Бои → Данжи**
2. Выбрать данж + короткий/длинный (+ F2)
3. **Создать** → скопировать код
4. Второй клиент: **Войти** по коду → **Ready**
5. **Боты** до 4/4 (или живые слоты)
6. Ключ / покупка → **В путь · 3v3**
7. Длинный путь бьёт `*_boss_long` (HP выше)

| Проверка | ☐ |
|---|---|
| Join по коду | |
| Ready sync / poll | |
| Long boss жёстче | |
| Редмет / first-clear | |
| Не рейд 12 | |
