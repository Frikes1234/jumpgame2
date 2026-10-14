import asyncio
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
WEBAPP_URL = os.getenv("WEBAPP_URL", "").strip()

dp = Dispatcher()


@dp.message(CommandStart())
async def start(message: Message):
    if not WEBAPP_URL.startswith("https://"):
        await message.answer(
            "Привет! 🎮\n\n"
            "Игра почти готова. Сначала опубликуй файлы игры на HTTPS-сайте, "
            "затем добавь ссылку в переменную WEBAPP_URL."
        )
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🎮 Играть в Jump Gap",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )
    ]])
    await message.answer(
        "Привет! Добро пожаловать в Jump Gap!\n\n"
        "Зажимай кнопку, чтобы зарядить прыжок, и отпускай её, "
        "чтобы перепрыгивать пропасти. За каждую преодолённую пропасть получаешь очко.\n\n"
        "Готов проверить свою реакцию?",
        reply_markup=keyboard
    )


async def main():
    if not BOT_TOKEN:
        raise RuntimeError(
            "Не задан BOT_TOKEN. Создай токен у @BotFather и задай переменную окружения BOT_TOKEN."
        )
    bot = Bot(token=BOT_TOKEN)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
