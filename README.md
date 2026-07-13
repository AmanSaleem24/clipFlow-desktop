# 🎬 ClipFlow

> **Screen recording & video sharing, simplified.** Record your screen, webcam, or both — then share with a link. Powered by an Electron desktop app for capture and a Next.js web platform for viewing, AI transcription, and team collaboration.

<p align="center">
  <a href="https://clip-flow-gamma.vercel.app">
    <img src="https://img.shields.io/badge/Web_App-clip--flow.vercel.app-7C3AED?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="https://github.com/AmanSaleem24/clipFlow-desktop/releases/tag/v1.0.0.0">
    <img src="https://img.shields.io/badge/Desktop_App-v1.0.0-2563EB?style=for-the-badge&logo=electron&logoColor=white" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron_30-47848F?style=flat-square&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Shadcn_UI-000000?style=flat-square&logo=shadcnui&logoColor=white" />
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=flat-square&logo=recharts&logoColor=white" />
</p>

---

## ✨ Features

**Desktop Recording (Electron App)**
- 🖥️ **Screen Capture** — Record full screen, specific windows, or custom regions
- 📸 **Floating Webcam Overlay** — Draggable, resizable webcam bubble alongside screen recording
- 🎥 **HD & SD Quality** — Choose between 1080p HD or 720p SD based on your needs
- ⚡ **One-Click Recording** — Start/stop with minimal UI from the system tray
- ☁️ **Instant Cloud Upload** — Videos auto-upload the moment you stop recording

**Web Platform (Next.js)**
- 🔗 **One-Click Sharing** — Every video gets a unique shareable link; recipients need zero downloads
- 🤖 **AI-Powered Summaries** — Automatic transcription with AI-generated titles and descriptions
- 💬 **Comments & Threaded Replies** — Collaborate directly on videos with organized discussions
- 👁️ **View Tracking & Alerts** — Email notifications when someone watches your video for the first time
- 📋 **Rich Embeds** — Copy rich-text embedded links with thumbnails for emails, Notion, Slack, or docs
- 📁 **Workspace Organization** — Organize videos into folders and invite team members
- 🔒 **Secure & Private** — Recordings stored securely on AWS with CloudFront CDN delivery

---

## 🛠️ Tech Stack

### Desktop App (Electron)

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Electron 30 + Vite 5 + React 18 + TypeScript |
| **Auth** | Clerk (`@clerk/clerk-react`) |
| **Real-time** | Socket.io Client (sync with web platform) |
| **Data Fetching** | TanStack React Query + Axios |
| **UI** | Tailwind CSS v4, Shadcn UI, Radix UI, Recharts |
| **Forms** | React Hook Form + Zod schema validation |
| **Build** | electron-builder (cross-platform distribution) |
| **Components** | Lucide icons, Sonner toasts, Vaul drawers, cmdk command palette |

### Web Platform

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js (App Router) + React + TypeScript |
| **Auth** | Clerk (OAuth + session management) |
| **AI** | OpenAI API — video transcription + title/description generation |
| **Storage** | AWS S3 + CloudFront CDN |
| **Real-time** | Socket.io (view tracking, live notifications) |
| **Notifications** | Email alerts via webhook on first view |
| **Styling** | Tailwind CSS, Shadcn UI |

---

## 📂 Project Structure (Desktop App)

```
clipFlow-desktop/
├── electron/                     # Electron main process
│   └── main.ts                   # App lifecycle, tray, IPC handlers
│
├── src/                          # React renderer (Vite)
│   ├── components/               # UI components
│   │   ├── recorder/             # Screen & webcam recording controls
│   │   ├── studio/               # Recording studio interface
│   │   ├── tray/                 # System tray widget
│   │   └── ui/                   # Shadcn UI primitives
│   ├── hooks/                    # Custom hooks (recorder, auth, upload)
│   ├── lib/                      # Utilities and API clients
│   └── App.tsx                   # Root component
│
├── dist-electron/                # Compiled Electron output
├── .github/workflows/            # CI/CD — auto-build & release
├── electron-builder.json5        # Build config (Windows, macOS, Linux)
├── index.html                    # Main window
├── studio.html                   # Studio recording window
├── webcam.html                   # Webcam overlay window
└── vite.config.ts                # Vite + Electron plugin config
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/AmanSaleem24/clipFlow-desktop.git
cd clipFlow-desktop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file:
```env
# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=pk_...

# API (Web platform backend)
VITE_API_URL=https://your-clipflow-api.vercel.app

# Socket.io
VITE_SOCKET_URL=https://your-socket-server.com
```

### 4. Run in development
```bash
npm run dev
```

### 5. Build for distribution
```bash
npm run build
```

Built executables will be in the `dist/` directory.

---

## 📥 Download

Pre-built binaries are available on the [Releases](https://github.com/AmanSaleem24/clipFlow-desktop/releases) page:
- **Windows** — `.exe` installer
- **macOS** — `.dmg` disk image
- **Linux** — `.AppImage`

---

## 📜 License

This project is for personal/portfolio use.
