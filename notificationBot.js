require("dotenv").config();
const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_IDS = process.env.ADMIN_IDS.split(",").map(id => id.trim());

// ✅ /start команда
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!ADMIN_IDS.includes(msg.from.id.toString())) {
    return bot.sendMessage(chatId, "⛔ У вас нет достпа.");
  }

  bot.sendMessage(chatId, "✅ Вы подписаны на уведомления.");
});

// 📌 API endpoint для уведомлений
app.post("/notify", (req, res) => {
  const { type, payload } = req.body;

  const messages = {
    deposit: `💸 Пользователь ${payload.userId} (@${payload.username || "нет username"}) пополнил баланс на сумму ${payload.amount} TON`,
    paid: `🔥 Пользователь ${payload.userId} (@${payload.username || "нет username"}) запустил ПЛАТНУЮ ноду №${payload.nodeIndex} за ${payload.stake} TON`,
    free: `🚀 Пользователь ${payload.userId} (@${payload.username || "нет username"}) запустил БЕСПЛАТНУЮ ноду`
  };

  const msg = messages[type];
  if (!msg) return res.status(400).json({ error: "Неверный тип уведомления." });

  ADMIN_IDS.forEach(adminId => {
    bot.sendMessage(adminId, msg);
  });

  res.status(200).json({ success: true });
});

// 🚀 Запуск
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`📢 Notification bot API работает на порту ${PORT}`);
});