# 🤖 SpendAI — AI-Powered Expense Tracker

A full-stack expense management application with an **AI chatbot** that understands natural language to manage your finances.

---

## ✨ Features

- 🔐 **JWT Authentication** — Signup, login with secure password hashing
- 💸 **Expense CRUD** — Add, edit, delete expenses with amount, category, date, description, payment method
- 🤖 **AI Chatbot** — Natural language interface using GPT-4o-mini (create, read, update, delete)
- 📊 **Dashboard** — Stat cards, spending trends, category pie chart, recent transactions
- 📋 **Transactions** — Paginated list with advanced filtering, search, multi-sort, bulk delete
- 🏷️ **Categories** — 8 predefined + custom categories with icon and color picker
- 🎯 **Budgets** — Monthly and per-category budgets with progress bars and alerts
- 📈 **Analytics** — Bar, line, and doughnut charts with period comparisons
- ⚙️ **Settings** — Profile management, currency selection

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Chart.js |
| Backend | Node.js, Express |
| Database | MongoDB (via Mongoose) |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| AI | OpenAI GPT-4o-mini API |
| Charts | Chart.js + react-chartjs-2 |
| UI | Vanilla CSS (dark theme, glassmorphism) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (running locally on port 27017)
- OpenAI API Key (from [platform.openai.com](https://platform.openai.com))

### 1. Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense_tracker
JWT_SECRET=your_super_secret_key_here
OPENAI_API_KEY=sk-your-openai-key-here
NODE_ENV=development
```

> ⚠️ **Important**: Replace `OPENAI_API_KEY` with your real key from OpenAI.

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Start MongoDB

Make sure MongoDB is running:
```bash
mongod
```

### 3. Start the Backend (Terminal 1)
```bash
cd backend
npm run dev
```
→ Runs on `http://localhost:5000`

### 4. Start the Frontend (Terminal 2)
```bash
cd frontend
npm start
```
→ Opens at `http://localhost:3000`

---

## 🤖 AI Chatbot Examples

The chatbot understands natural language. Here are some example commands:

| Intent | Example |
|--------|---------|
| Add expense | `"I spent $45 on groceries yesterday"` |
| Add with details | `"Add coffee $5 today, paid by card"` |
| Query spending | `"How much did I spend on food this month?"` |
| Show summary | `"Show my spending summary"` |
| Update expense | `"Change my last expense to transport"` |
| Update amount | `"Actually make that $6"` |
| Delete expense | `"Delete my last expense"` |
| Analytics | `"Compare my spending this month vs last"` |
| Budget status | `"What's my budget status?"` |

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── models/         # Mongoose schemas (User, Expense, Category, Budget, ChatMessage)
│   ├── routes/         # Express route handlers
│   ├── middleware/     # JWT auth middleware
│   ├── services/       # AI chatbot service (OpenAI integration)
│   ├── server.js       # Express app entry point
│   └── .env            # Environment variables
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/       # AI ChatPanel
│   │   │   ├── expenses/   # ExpenseModal
│   │   │   └── layout/     # Sidebar, AppLayout
│   │   ├── context/        # AuthContext
│   │   ├── pages/          # Dashboard, Transactions, Analytics, Budgets, Categories, Settings
│   │   ├── services/       # Axios API client
│   │   ├── App.js          # Router & route guards
│   │   └── index.css       # Full design system & styles
│   └── .env
│
└── package.json        # Root scripts
```

---

## 🎨 Design

- **Dark theme** with deep purple gradient accents
- **Glassmorphism** card effects
- **Smooth animations** — fade-in, slide-up, skeleton loaders
- **Fully responsive** for desktop and tablet views
- Google Fonts (Inter) for premium typography
