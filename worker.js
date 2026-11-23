
const TELEGRAM_API = "https://api.telegram.org";

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("Smile Pedic Bot is running!");
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const update = await request.json();

      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text || "";

        if (text === "/start") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "👋 Вітаємо у грі «Вгадай педика по посмішці»!\n\n😏 Перевір свою уважність!\n\nНатискай кнопку нижче та починай гру.",
            {
              inline_keyboard: [
                [{ text: "🎮 ГРАТИ", callback_data: "play" }],
                [{ text: "📖 Правила", callback_data: "rules" }]
              ]
            }
          );
        } else if (text === "/help") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "Команди:\n/start — головне меню\n/help — допомога"
          );
        }
      }

      if (update.callback_query) {
        const query = update.callback_query;
        const chatId = query.message.chat.id;

        await fetch(`${TELEGRAM_API}/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: query.id })
        });

        if (query.data === "play") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "🎮 Гра починається!\n\nНезабаром тут з'являться фотографії та варіанти відповідей."
          );
        }

        if (query.data === "rules") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "📖 ПРАВИЛА ГРИ\n\n1. Дивись на фотографію.\n2. Обирай правильну відповідь.\n3. Заробляй бали.\n4. Змагайся з іншими гравцями!"
          );
        }
      }

      return new Response("OK");
    } catch (error) {
      return new Response("Internal error", { status: 500 });
    }
  }
};

async function sendMessage(token, chatId, text, keyboard) {
  const body = {
    chat_id: chatId,
    text
  };

  if (keyboard) {
    body.reply_markup = keyboard;
  }

  return fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
