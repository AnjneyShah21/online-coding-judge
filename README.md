# ⚡ AI Judge — Online Programming Judge & AI Evaluation Platform

An enterprise-grade, full-stack **Online Coding Judge** and interactive competitive programming platform with sandboxed multi-language code execution, isolated kernel namespaces, and AI-powered test case generation, code analysis, and smart hints.

---

## 🚀 Key Features

### 🛡️ Kernel-Isolated Sandbox Execution
- **Untrusted Code Execution**: Runs user submissions in unprivileged Linux sandboxes using **Bubblewrap (`bwrap`)**.
- **Security Protections**:
  - `unshare-all` (unshares network, PID, IPC, UTS, user, and cgroup namespaces). Untrusted user code cannot make network connections, spawn fork-bombs, or access host processes.
  - Read-only system filesystem mounts (`/usr`, `/lib`, `/bin`) with an isolated temporary execution directory.
  - Strict wall-clock execution timeouts (e.g. 1500ms – 2000ms) and output stream size limits to prevent runaway programs and buffer floods.
  - Standard verdicts: **Accepted (AC)**, **Wrong Answer (WA)**, **Time Limit Exceeded (TLE)**, **Compilation Error (CE)**, and **Runtime Error (RE)**.

### 🌐 Multi-Language Execution Engine
- **Python 3**: Native execution in restricted sandboxes.
- **C++ (GCC g++)**: Compiled with `-O2 -std=c++17`, stripped and executed with fast I/O.
- **JavaScript (Node.js)**: Fast asynchronous script execution with memory caps.

### 👥 Separate Admin & User Portals
- **Distinct Authentication & Navigation**:
  - **User Portal (`/login`, `/register`)**: Cyan/Blue coding aesthetic, problem catalog, Monaco IDE, submission history, and global rankings.
  - **Admin Portal (`/admin/login`, `/admin`)**: Deep violet/purple security theme, strict role verification, real-time platform metrics, problem creator, and test suite manager.

### 🤖 AI-Powered Capabilities (Google Gemini)
- **AI Test Case Generator**: Admins can automatically generate tricky edge cases, boundary conditions, and stress tests for any problem.
- **AI Smart Hints (3 Levels)**:
  - *Level 1 (Nudge)*: Subtle intuition without spoiling the logic.
  - *Level 2 (Technique)*: Data structure and algorithmic pattern recommendation.
  - *Level 3 (Step-by-Step)*: Detailed logic walkthrough.
- **AI Code Reviewer**: Analyzes active code for Big-O Time & Space Complexity, code smells, and optimization tips.

### 💻 Developer Experience & Monaco IDE
- Embedded **Monaco Editor** with VS-Dark syntax highlighting, line numbers, and auto-formatting.
- Split-screen problem solver layout with real-time submission polling.
- Live results console with pass/fail breakdown across sample & hidden test suites.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS + Tailwind |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Backend** | Next.js REST API Routes, Node.js worker execution pipeline |
| **Sandbox** | Linux Bubblewrap (`bwrap`) with unshared kernel namespaces |
| **Database** | SQLite via `better-sqlite3` (WAL mode enabled) |
| **Authentication** | JWT via `jose`, bcryptjs password hashing, HTTP-only secure cookies |
| **AI Integration** | Google Gemini API (`gemini-2.0-flash`) |

---

## 🔑 Default Administrator Credentials

| Role | Email | Password | Portal |
|---|---|---|---|
| **Admin** | `admin@aijudge.local` | `admin123` | [`/admin/login`](http://localhost:3000/admin/login) |

*Regular users can register freely at [`/register`](http://localhost:3000/register).*

---

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** >= 18 (Node.js 20+ or 22+ recommended)
- **Linux** (or WSL2 on Windows) with `bwrap` (Bubblewrap) installed:
  ```bash
  # Debian/Ubuntu:
  sudo apt-get install bubblewrap g++

  # Arch Linux:
  sudo pacman -S bubblewrap gcc
  ```

### 2. Installation
```bash
git clone https://github.com/AnjneyShah21/online-coding-judge.git
cd online-coding-judge
npm install
```

### 3. Environment Variables (Optional)
To enable the AI Test Case Generator and AI Code Reviewer, create `.env.local`:
```env
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="your-super-secret-jwt-key"
```
*(If no Gemini API key is provided, the platform automatically utilizes intelligent built-in heuristics and sample edge-case generators.)*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── admin/               # Admin Portal (Dashboard, Problems, Submissions)
│   │   │   ├── login/           # Dedicated Admin Login
│   │   │   ├── problems/        # Problem Management & Test Case Editor
│   │   │   └── submissions/     # Platform-wide Submissions Monitor
│   │   ├── api/                 # Backend REST Endpoints
│   │   │   ├── admin/stats/     # Admin Metrics API
│   │   │   ├── ai/              # AI Test Case Gen, Review, & Hints API
│   │   │   ├── auth/            # Auth, Login, Register, & Me Sessions
│   │   │   ├── leaderboard/     # Leaderboard API
│   │   │   ├── problems/        # Problem CRUD & Test Case Endpoints
│   │   │   └── submissions/     # Sandboxed Submissions & Judging Queue
│   │   ├── leaderboard/         # Global User Rankings Page
│   │   ├── login/               # User Login Page
│   │   ├── problems/            # Problem Catalog & Monaco IDE Solver
│   │   ├── register/            # User Registration Page
│   │   ├── submissions/         # User Submission History
│   │   ├── globals.css          # Core Design System & Glassmorphism Styles
│   │   └── page.tsx             # Animated Landing Page
│   ├── components/              # Shared Navigation, Badges, & Sidebars
│   └── lib/
│       ├── ai.ts                # Gemini API Integration
│       ├── auth.ts              # JWT & Session Guards
│       ├── db.ts                # SQLite Schema, Queries, & Default Seeds
│       └── sandbox.ts           # Bubblewrap (bwrap) Execution Engine
├── package.json
└── tsconfig.json
```

---

## 📜 License
MIT License. Built for competitive programming and secure automated code evaluation.
