
import { QUESTIONS } from "./questions.js";

const API = "https://api.telegram.org";

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("Smile Pedic Bot is running!");
    }

    try {
      const update = await request.json();

      if (update.message) {
        const chatId = update.message.chat.id;
        const text = update.message.text || "";

        if (text === "/start") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "😏 Ласкаво просимо до гри!\n\nВгадай людину по посмішці та перевір свою уважність!",
            [[{ text: "🎮 ГРАТИ", callback_data: "play" }],
             [{ text: "📖 ПРАВИЛА", callback_data: "rules" }]]
          );
        }
      }

      if (update.callback_query) {
        const q = update.callback_query;
        const chatId = q.message.chat.id;

        await fetch(`${API}/bot${env.BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: q.id })
        });

        if (q.data === "play" || q.data === "next") {
          await sendQuestion(env.BOT_TOKEN, chatId);
        }

        if (q.data === "rules") {
          await sendMessage(env.BOT_TOKEN, chatId,
            "📖 ПРАВИЛА ГРИ\n\n1. Розглянь фотографію.\n2. Обери ім'я.\n3. Дізнайся правильну відповідь.\n4. Переходь до наступного питання!"
          );
        }

        if (q.data.startsWith("answer:")) {
          const [, id, index] = q.data.split(":");
          const question = QUESTIONS.find(x => x.id === Number(id));

          if (question) {
            const selected = question.options[Number(index)];
            const correct = selected === question.answer;

            await sendMessage(env.BOT_TOKEN, chatId,
              (correct ? "✅ Правильно!" : "❌ Неправильно!") +
              `\n\nПравильна відповідь: ${question.answer}`,
              [[{ text: "➡️ НАСТУПНЕ ПИТАННЯ", callback_data: "next" }]]
            );
          }
        }
      }

      return new Response("OK");
    } catch (error) {
      return new Response("Error", { status: 500 });
    }
  }
};

async function sendQuestion(token, chatId) {
  const question = QUESTIONS[
    Math.floor(Math.random() * QUESTIONS.length)
  ];

  const keyboard = question.options.map((option, index) => [{
    text: option,
    callback_data: `answer:${question.id}:${index}`
  }]);

  if (question.image) {
    await fetch(`${API}/bot${token}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: question.image,
        caption: question.question,
        reply_markup: { inline_keyboard: keyboard }
      })
    });
  } else {
    await sendMessage(token, chatId,
      "📸 " + question.question + "\n\n(Фото ще не додано)",
      keyboard
    );
  }
}

async function sendMessage(token, chatId, text, keyboard) {
  const body = { chat_id: chatId, text };

  if (keyboard) {
    body.reply_markup = { inline_keyboard: keyboard };
  }

  return fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}
