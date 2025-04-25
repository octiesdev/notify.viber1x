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
    return bot.sendMessage(chatId, "⛔ У вас нет доступа.");
  }

  bot.sendMessage(chatId, "✅ Вы подписаны на уведомления.");
});

// 📌 API endpoint для уведомлений
app.post("/notify", (req, res) => {
  const { type, payload } = req.body;

    // Если пользователь из bot_test рефералов — пропускаем отправку уведомлений
    if (payload.referredBy === "bot_test" || payload.refCode === "bot_test") {
      console.log("⛔ Пропускаем уведомление для тестового реферала (bot_test).");
      return res.status(200).json({ skipped: true });
    }
  

  const messages = {
    deposit: `💸 Пользователь ${payload.userId} (@${payload.username || "нет username"}) пополнил баланс на сумму ${payload.amount} TON`,
    paid: `🔥 Пользователь ${payload.userId} (@${payload.username || "нет username"}) запустил ПЛАТНУЮ ноду №${payload.nodeIndex} за ${payload.stake} TON`,
    free: `🚀 Пользователь ${payload.userId} (@${payload.username || "нет username"}) запустил БЕСПЛАТНУЮ ноду`,
    start: `👋 Пользователь ${payload.userId} (@${payload.username || "нет username"}) зашел в приложение${payload.referredBy ? ` (пригласил ${payload.referredBy})` : ""}`
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