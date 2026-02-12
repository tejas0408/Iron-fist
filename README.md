<h1 align="center">💪 Iron Fist — AI Fitness Assistant 🤖</h1>

<p align="center">
  <b>Your personal AI-powered fitness companion that creates customized workout plans and diet programs through natural voice conversations.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Convex-Backend-FF6B00?logo=convex" alt="Convex" />
  <img src="https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk" alt="Clerk" />
</p>

---

## ✨ Features

- **🎙️ Voice AI Assistant** — Engage in natural voice conversations powered by the Web Speech API and OpenAI AI to discuss your fitness goals, physical condition, and preferences
- **🏋️ Personalized Workout Plans** — Get custom exercise routines tailored to your fitness level, injuries, available equipment, and goals
- **🥗 Custom Diet Programs** — Receive personalized meal plans that account for your allergies, dietary preferences, and nutritional needs
- **🔒 Authentication & Authorization** — Secure sign-in with GitHub, Google, or email/password via Clerk
- ** Program Management** — Create and view multiple fitness programs with only the latest one active
- **🎬 Real-time Program Generation** — Watch your personalized plan generate in real-time with a terminal-style overlay
- **📱 Responsive Design** — Beautiful, modern UI that works seamlessly across desktop, tablet, and mobile
- **🎭 Server & Client Components** — Optimized rendering with Next.js App Router architecture

---

## 🛠️ Technologies Used

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | [Next.js 15](https://nextjs.org/) | React framework with App Router, API routes, and Turbopack |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe development |
| **UI Library** | [React 18](https://react.dev/) | Component-based UI |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS framework |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) | Accessible, customizable component library |
| **Authentication** | [Clerk](https://clerk.com/) | User management, OAuth, and session handling |
| **Database** | [Convex](https://www.convex.dev/) | Real-time serverless database and backend |
| **AI / LLM** | [OpenAI AI](https://openai.com/) | Generating personalized fitness & diet programs |
| **Voice** | Web Speech API | Browser-native speech recognition and synthesis |
| **Icons** | [Lucide React](https://lucide.dev/) | Modern icon library |
| **Charts** | [Recharts](https://recharts.org/) | Data visualization |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | Form management and validation |
| **Notifications** | [Sonner](https://sonner.emilkowal.dev/) | Toast notifications |

---

## 📁 Folder Structure

```
iron-fist/
├── public/                        # Static assets (images, icons)
├── convex/                        # Convex backend
│   ├── schema.ts                  # Database schema definitions
│   ├── users.ts                   # User mutations & queries
│   ├── plans.ts                   # Fitness plan mutations & queries
│   ├── http.ts                    # HTTP endpoints (webhooks, AI generation)
│   ├── auth.config.ts             # Convex auth configuration
│   └── _generated/                # Auto-generated Convex types
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Landing / home page
│   │   ├── globals.css            # Global styles & theme
│   │   ├── (auth)/                # Auth route group
│   │   │   ├── sign-in/           # Sign-in page
│   │   │   └── sign-up/           # Sign-up page
│   │   ├── profile/               # User profile page
│   │   ├── generate-program/      # Program generation page
│   │   └── api/
│   │       ├── chat/              # AI chat API route
│   │       └── generate-program/  # Program generation API route
│   ├── components/                # React components
│   │   ├── Navbar.tsx             # Navigation bar
│   │   ├── Footer.tsx             # Site footer
│   │   ├── ProfileHeader.tsx      # User profile header
│   │   ├── UserPrograms.tsx       # Fitness programs display
│   │   ├── NoFitnessPlans.tsx     # Empty state component
│   │   ├── CornerElements.tsx     # Decorative corner elements
│   │   ├── terminal-overlay.tsx   # Terminal-style generation overlay
│   │   └── ui/                    # shadcn/ui component library (53 components)
│   ├── constants/
│   │   └── index.ts               # App-wide constants
│   ├── hooks/
│   │   └── use-mobile.ts          # Mobile detection hook
│   ├── lib/
│   │   ├── utils.ts               # Utility functions (cn helper)
│   │   └── voice-assistant.ts     # Voice AI assistant logic
│   ├── providers/
│   │   └── ConvexClerkProvider.tsx # Convex + Clerk auth provider
│   └── middleware.ts              # Clerk auth middleware
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json                # shadcn/ui configuration
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Convex Database
CONVEX_DEPLOYMENT=
NEXT_PUBLIC_CONVEX_URL=

# OpenAI AI
OPENAI_API_KEY=
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- **npm** or your preferred package manager
- Accounts on [Clerk](https://clerk.com/), [Convex](https://www.convex.dev/), and [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tejas0408/Iron-fist.git
   cd Iron-fist
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables** — copy the template above into `.env.local` and fill in your keys

4. **Start the Convex backend**

   ```bash
   npx convex dev
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) in your browser

---

## 🚢 Deployment

This application is deployed to **Vercel**:

```bash
npm run build
npm run start
```

Or connect your GitHub repository to [Vercel](https://vercel.com/) for automatic deployments. Make sure to set all environment variables in the Vercel dashboard.

---

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [Google Gemini AI Documentation](https://ai.google.dev/gemini-api)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
