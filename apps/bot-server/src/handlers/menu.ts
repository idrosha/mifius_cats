import type { Context } from "grammy";

const SOON = "Скоро 🚧";

async function replySoon(ctx: Context, title: string): Promise<void> {
  await ctx.reply(`*${title}*\n\n${SOON}`, { parse_mode: "Markdown" });
}

export async function handleSingle(ctx: Context): Promise<void> {
  await replySoon(ctx, "Одиночная игра");
}

export async function handleOnline(ctx: Context): Promise<void> {
  await replySoon(ctx, "Онлайн");
}

export async function handleChampionship(ctx: Context): Promise<void> {
  await replySoon(ctx, "Чемпионат");
}

export async function handleLeaders(ctx: Context): Promise<void> {
  await replySoon(ctx, "Таблица лидеров");
}

export async function handleShop(ctx: Context): Promise<void> {
  await replySoon(ctx, "Магазин");
}

export async function handleAccount(ctx: Context): Promise<void> {
  await replySoon(ctx, "Аккаунт");
}

export async function handleSettings(ctx: Context): Promise<void> {
  await replySoon(ctx, "Настройки");
}
