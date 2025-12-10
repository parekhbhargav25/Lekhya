# 🧾 Lekhya - AI-Powered Receipt & Expense Intelligence Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS_S3-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

**Transform your receipts into actionable financial insights with the power of AI**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Usage](#-usage) • [Screenshots](#-screenshots)

</div>

---

## 📋 Overview

Lekhya is a modern, intelligent expense tracking platform that leverages AI to automatically extract, categorize, and analyze your spending from receipt images. Upload your receipts, chat with your expenses, and gain insights into your financial habits—all through a beautiful, intuitive interface.

## ✨ Features

### 🤖 AI-Powered Receipt Processing
- **Smart Data Extraction**: Automatically extracts merchant name, date, total, items, and categories from receipt images
- **OpenAI Integration**: Leverages GPT models for accurate text recognition and structured data parsing
- **Batch Processing**: Upload multiple receipts at once for efficient expense tracking

### 💬 Conversational AI Assistant
- **Natural Language Queries**: Ask questions like "Where did I spend the most this month?" or "What item did I spend the most on at Costco?"
- **LangChain Integration**: Powered by custom chain logic for contextual financial Q&A
- **Real-Time Chat UI**: Floating chat widget for instant access to your expense insights

### 📊 Analytics Dashboard
- **Bento-Style Design**: Modern, card-based layout with glassmorphism effects
- **Category Breakdowns**: Visual representation of spending by category
- **Monthly Summaries**: Track spending trends over time
- **Animated Counters**: Eye-catching statistics with smooth animations
- **Recent Receipts**: Quick access to your latest uploads

### 🔐 Secure & Multi-User
- **NextAuth Authentication**: Secure login/signup with multiple provider support
- **User-Scoped Data**: All receipts and analytics are private to each user
- **Protected API Routes**: Server-side validation ensures data security

### 🎨 Modern UX
- **Glassmorphism UI**: Beautiful, modern login and signup pages
- **Receipt Previews**: View full receipt images in modal dialogs
- **Category Overrides**: Manually adjust categories for better accuracy
- **Interactive Features**: One-click AI extraction and re-processing

## 🛠️ Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Components** - Custom, reusable UI components

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe ORM for database operations
- **PostgreSQL** - Relational database for structured data
- **NextAuth** - Authentication and session management

### AI & ML
- **OpenAI API** - GPT models for text extraction and analysis
- **LangChain** - Framework for building LLM applications
- **Structured Output Parsing** - Reliable JSON extraction from AI responses

### Cloud & Storage
- **AWS S3** - Scalable object storage for receipt images
- **Vercel** (recommended) - Deployment platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- AWS S3 bucket
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lekhya.git
cd lekhya
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lekhya"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Uploading Receipts
1. Log in to your account
2. Navigate to the dashboard
3. Click "Upload Receipt" or drag and drop receipt images
4. Click "Run AI Extraction" to automatically parse receipt data
5. Review and edit extracted information if needed

### Using the AI Assistant
1. Click the floating chat icon in the bottom right
2. Ask natural language questions about your expenses:
   - "How much did I spend on groceries this month?"
   - "Show me my top 5 expenses"
   - "Where did I spend the most on dining?"
3. Get instant, contextual answers based on your data

### Viewing Analytics
- **Dashboard Overview**: See total spending, transaction count, and average transaction
- **Category Breakdown**: Visual pie chart of spending by category
- **Monthly Trends**: Track spending patterns over time
- **Recent Activity**: Quick view of your latest receipts

## 📸 Screenshots

### Lekhya Landing Page
![Landing Page](https://drive.google.com/file/d/1pA5veQ9UsaWiD41N8V1EU8A6pTTQuAzG/view?usp=sharing)
*AI-powered analytics dashboard with spending insights and category breakdowns*

### Dashboard Overview
![Dashboard](https://drive.google.com/file/d/1pA5veQ9UsaWiD41N8V1EU8A6pTTQuAzG/view?usp=sharing)
*AI-powered analytics dashboard with spending insights and category breakdowns*

### Receipt Upload & Extraction
![Receipt Upload](https://via.placeholder.com/800x450/1a1a2e/eee?text=Receipt+Upload+Screenshot)
*Upload receipts and let AI extract structured data automatically*

### AI Chat Assistant
![Chat Assistant](https://via.placeholder.com/800x450/1a1a2e/eee?text=AI+Chat+Screenshot)
*Ask natural language questions about your expenses*

### Analytics & Insights
![Analytics](https://via.placeholder.com/800x450/1a1a2e/eee?text=Analytics+Screenshot)
*Visual spending trends and monthly summaries*

### Authentication
![Login](https://via.placeholder.com/800x450/1a1a2e/eee?text=Login+Screenshot)
*Secure login with modern glassmorphism design*

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Export to CSV/Excel
- [ ] Budget tracking and alerts
- [ ] Multi-currency support
- [ ] Receipt splitting for shared expenses
- [ ] Integration with banking APIs
- [ ] Advanced reporting and forecasting

## 👤 Author

**Bhargav Parekh**

- Website: [bhargavdev.com](https://bhargavdev.com)
- GitHub: [@parekhbhargav25](https://github.com/parekhbhargav25)
- LinkedIn: [linkedin.com/in/parbhr](https://linkedin.com/in/parbhr)

## 🙏 Acknowledgments

- OpenAI for the powerful GPT API
- Vercel for the amazing deployment platform
- The Next.js team for the incredible framework
- LangChain for simplifying LLM application development

---

<div align="center">

**If you find this project useful, please consider giving it a ⭐️**

Made with ❤️ by Bhargav Parekh

</div>
