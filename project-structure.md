# Structure

whatsapp-reminder-bot/
├── src/
│ ├── app.js
│ ├── config/
│ │ ├── database.js
│ │ └── timezone.js
│ │
│ ├── bot/
│ │ ├── client.js
│ │ ├── messageHandler.js
│ │ └── qrHandler.js
│ │
│ ├── commands/
│ │ ├── index.js
│ │ ├── setReminder.command.js
│ │ ├── listReminder.command.js
│ │ ├── editReminder.command.js
│ │ ├── deleteReminder.command.js
│ │ └── help.command.js
│ │
│ ├── conversations/
│ │ ├── pendingStore.js
│ │ ├── setReminder.flow.js
│ │ └── editReminder.flow.js
│ │
│ ├── services/
│ │ ├── reminder.service.js
│ │ └── scheduler.service.js
│ │
│ ├── repositories/
│ │ └── reminder.repository.js
│ │
│ ├── utils/
│ │ ├── date.util.js
│ │ ├── parser.util.js
│ │ ├── formatter.util.js
│ │ └── validator.util.js
│ │
│ └── constants/
│ ├── commands.js
│ └── days.js
│
├── database/
│ ├── schema.sql
│ └── seed.sql
│
├── storage/
│ └── .gitkeep
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
