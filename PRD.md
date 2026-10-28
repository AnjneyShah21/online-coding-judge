# Product Requirements Document (PRD)
## Project: AI Online Coding Judge & Competitive Arena

---

## 1. Executive Summary
**AI Judge** is a high-performance, modern online coding judge and tournament arena built for software engineers, algorithmic problem setters, and competitive programmers. 

It provides sub-second multi-language code compilation, isolated language tracks (C++, Java, Python, JavaScript), an interactive code editor, sandboxed execution with time and memory metrics, weekly competitive contests with anti-cheat locks, a community discussion forum, and integrated developer telemetry with activity heatmaps and streak counters.

---

## 2. Complete Technology Stack

### 2.1 Core Framework & Language
- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router architecture with React Server Components and Route Handlers)
- **Frontend Library**: [React](https://react.dev/) 19
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/) 5 (Strict Mode enabled across all components, APIs, and models)
- **Runtime**: [Node.js](https://nodejs.org/) (LTS, Linux x86_64 environment)

### 2.2 Database & Storage
- **Database Engine**: [SQLite](https://www.sqlite.org/) with Write-Ahead Logging (`WAL` mode) enabled for concurrent reads and writes
- **Driver**: [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) (synchronous, zero-overhead C++ binding for Node.js)
- **File Storage**: Local sandboxed temp directory (`/tmp/ai-judge-sandbox`) with automatic ephemeral directory cleanup

### 2.3 Code Editor & Client UI
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/react` (the engine powering VS Code) with syntax highlighting, indentation guides, and line numbers
- **Design System**: KokonutUI-inspired aesthetic featuring dark glassmorphism, tailored HSL color tokens, and custom SVG iconography
- **Interactive Background**: Dynamic HTML5 Canvas physics mesh with real-time cursor gravity and touch responsiveness
- **Typography**: Inter (UI font) and JetBrains Mono / SF Mono (monospace code font)

### 2.4 Code Execution & Sandbox Engine
- **Sandboxed Runner**: Subprocess execution via `child_process.spawn` and `child_process.execSync` with POSIX `timeout` guards
- **Supported Compilers & Runtimes**:
  - **C++**: `g++ -O2 -std=c++17`
  - **Java**: `javac Solution.java` / `java Solution`
  - **Python**: `python3 solution.py`
  - **JavaScript**: `node solution.js`
- **Resource Constraints**:
  - Configurable execution time limits per problem (default: `1000ms` – `5000ms`)
  - Configurable memory limits per problem (default: `128MB` – `512MB`)
  - Stdin/stdout streaming with trailing whitespace normalization

### 2.5 Authentication & Security
- **Authentication**: Stateless JSON Web Tokens ([`jsonwebtoken`](https://github.com/auth0/node-jsonwebtoken) / [`jose`](https://github.com/panva/jose))
- **Credential Storage**: [`bcryptjs`](https://github.com/dcodeIO/bcrypt.js) salted hash algorithm (cost factor 10)
- **Cookie Security**: `HttpOnly`, `SameSite=Lax`, `Path=/` session cookie (`auth_token`)
- **OAuth 2.0**: Google Sign-In integration via `@react-oauth/google` and Google Token verification endpoints
- **Role-Based Access Control (RBAC)**: Distinguishes between `user` and `admin` roles across all UI routes and API endpoints

### 2.6 Artificial Intelligence Integration
- **Model**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) via Google Generative AI REST API
- **Features**:
  - 3-tier progressive hint generation (Nudge → Technique → Logic Guide)
  - Static code quality and Big-O asymptotic analysis (Time & Space complexity)
  - Automated edge-case test case generator for problem setters

---

## 3. Product Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Browser                        │
│  (Next.js 16 Client Components + Monaco Editor + UserNav)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON / REST
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Route Handlers                  │
│  /api/problems  /api/submissions  /api/contests  /api/ai    │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      SQLite Database         │ │      Sandbox Runner        │
│    (better-sqlite3, WAL)     │ │  (g++, javac, python3,     │
│  Users, Problems, TestCases, │ │   node + Linux namespaces) │
│  Submissions, Contests       │ └────────────────────────────┘
└──────────────────────────────┘
```

---

## 4. Key Functional Modules & Requirements

### 4.1 Problem Management & Dedicated Language Tracks
- **Track Isolation**: Challenges are segregated by programming language track (`cpp`, `java`, `python`, `javascript`). Developers select their preferred track and only see challenges engineered for that language.
- **Pristine Markdown Parsing**: Custom parser (`ProblemDescription.tsx`) converts raw problem definitions into clean visual cards:
  - Input Format Card (Cyan theme with `<IconTerminal />`)
  - Output Format Card (Purple theme with `<IconCode />`)
  - Constraints Card (Green theme with `<IconShield />`)
  - Zero raw markdown artifacts (`#`, `###`, backticks) are displayed.
- **Sample Test Cases**: Public sample cases with inputs, expected outputs, and interactive execution runners.
- **Hidden Test Suites**: Secure test cases invisible to non-admin players, utilized for final verdict determination.

### 4.2 Code Execution & Verifier
- **Verdicts**:
  - `Accepted (AC)`: Output matches expected outputs across all test cases.
  - `Wrong Answer (WA)`: Output differs from expected format or answer.
  - `Time Limit Exceeded (TLE)`: Process exceeded allowed wall-clock time limit.
  - `Runtime Error (RE)`: Non-zero exit code, unhandled exception, or segfault.
  - `Compilation Error (CE)`: Compiler output (e.g. `g++`, `javac`) returned with error diagnostics.
- **Live Submission Status**: Polling interface tracks execution state in real time (`Pending` → `Evaluating` → `Final Verdict`).

### 4.3 Integrated Telemetry Dashboard
- Integrated directly alongside the problem registry on `/problems` (no separate top tab).
- **Solved Metrics**: Visual progress bar indicating total solved problems out of total catalog.
- **Difficulty Distribution**: Color-coded breakdown of Easy (Emerald), Medium (Amber), and Hard (Rose) solved counts.
- **Streak Tracker**: Current daily practice streak counter with flame indicator and all-time max streak.
- **Activity Heatmap**: 16-week compact activity grid with hover tooltips displaying date, accepted count, and total submissions.
- **Bookmarked Challenges**: Quick-access drawer for bookmarked challenges.

### 4.4 Competitive Contest Arena
- **Contest Lifecycle**: Tracks upcoming, live now, and concluded competitive events.
- **Privacy Controls**:
  - Unpublished contests (`is_published: 0`) are visible **only** to the creator or administrators.
  - Normal players cannot see or enroll in unpublished events.
  - Creators have an immediate "Publish Live" / "Unpublish" toggle button.
- **Non-Exitable Arena Lock**:
  - During an active live contest session, accidental exits or window closures are blocked via `beforeunload` event traps.
  - The participant must explicitly click **"Exit Contest"**.
  - A confirmation modal warns that exiting will **permanently auto-end** their session.
  - Upon confirming exit, `has_ended` is set in the database, the score is locked, and re-entry or further code submission is prevented.
- **Real-Time Leaderboard**: Live standings ranked by solved problem score and submission penalty time.

### 4.5 Problem Discussion Forum
- Interactive discussion area available inside each problem workspace under the **Discussions** tab.
- Developers can post algorithm breakdowns, Big-O explanations, and questions.
- Nested reply threads with time-stamped responses.
- Interactive upvoting system with live counters.
- Special Staff/Admin badges for verified team members.

### 4.6 Administrative Console
- **Telemetry Overview**: Platform-wide metrics (total users, submissions, accepted rate, active contests).
- **Problem Authoring Suite**: Complete problem authoring interface with starter code editor and test suite builder.
- **AI Test-Case Generator**: Uses Gemini to synthesize 5 tricky edge cases based on problem description.
- **Submission Inspector**: Real-time audit log of all platform submissions with source code viewer and test-suite diagnostics.
- **Contest Scheduler**: Tournament creation form with problem selection, custom point weights, and publishing controls.
- **User Moderation**: User audit registry with role toggle and ban enforcement.

---

## 5. Database Schema Specification

```sql
-- Users & Roles
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'admin'
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Problemset & Language Isolation
CREATE TABLE problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL, -- 'easy' | 'medium' | 'hard'
  time_limit_ms INTEGER DEFAULT 2000,
  memory_limit_mb INTEGER DEFAULT 256,
  tags TEXT DEFAULT '[]', -- JSON string array
  starter_code TEXT DEFAULT '{}', -- JSON object by language
  target_languages TEXT DEFAULT '[]', -- JSON string array
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Test Suites
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample INTEGER DEFAULT 0, -- 1 = public sample, 0 = hidden test
  order_index INTEGER DEFAULT 0
);

-- Submissions & Results
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  problem_id TEXT REFERENCES problems(id),
  code TEXT NOT NULL,
  language TEXT NOT NULL, -- 'cpp' | 'java' | 'python' | 'javascript'
  verdict TEXT DEFAULT 'pending', -- 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'compilation_error' | 'runtime_error'
  runtime_ms INTEGER,
  memory_kb INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submission_results (
  id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES submissions(id) ON DELETE CASCADE,
  test_case_id TEXT REFERENCES test_cases(id),
  verdict TEXT NOT NULL,
  actual_output TEXT,
  runtime_ms INTEGER,
  memory_kb INTEGER,
  error_message TEXT
);

-- Contests & Tournaments
CREATE TABLE contests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  created_by TEXT REFERENCES users(id),
  is_published INTEGER DEFAULT 0, -- 0 = private (creator only), 1 = public
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contest_problems (
  id TEXT PRIMARY KEY,
  contest_id TEXT REFERENCES contests(id) ON DELETE CASCADE,
  problem_id TEXT REFERENCES problems(id),
  score INTEGER DEFAULT 100,
  order_index INTEGER DEFAULT 0
);

CREATE TABLE contest_participants (
  id TEXT PRIMARY KEY,
  contest_id TEXT REFERENCES contests(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  score INTEGER DEFAULT 0,
  has_ended INTEGER DEFAULT 0,
  ended_at DATETIME,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contest_id, user_id)
);

-- Discussions & Community
CREATE TABLE discussions (
  id TEXT PRIMARY KEY,
  problem_id TEXT REFERENCES problems(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  parent_id TEXT REFERENCES discussions(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE discussion_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  discussion_id TEXT REFERENCES discussions(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, discussion_id)
);
```

---

## 6. API Route Specification

| Route | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth` | `POST` | Public | User registration and password authentication |
| `/api/auth/me` | `GET` | Authenticated | Retrieve current session user payload |
| `/api/problems` | `GET` / `POST` | Public / Admin | Fetch problem catalog or author new problem |
| `/api/problems/[id]` | `GET` / `PUT` / `DELETE` | Public / Admin | Fetch problem details, update, or remove problem |
| `/api/submissions` | `GET` / `POST` | Authenticated | Fetch past submissions or submit new code solution |
| `/api/submissions/[id]` | `GET` | Authenticated | Poll live submission verdict and test case outputs |
| `/api/contests` | `GET` / `POST` / `PUT` | Authenticated | Fetch contests, register, exit/auto-end, or toggle publish |
| `/api/discussions` | `GET` / `POST` / `PUT` | Authenticated | Read discussion threads, reply, or upvote |
| `/api/user/progress` | `GET` | Public / User | Telemetry stats (streak, heatmaps, solved counts) |
| `/api/bookmarks` | `GET` / `POST` | Authenticated | Toggle or fetch starred challenges |
| `/api/ai` | `POST` | Authenticated | Request AI hints, Big-O review, or test case generation |

---

## 7. Environment & Configuration Guide

For standard development and local execution, **no environment variables are required**. The project includes fallbacks for all local operations.

To enable optional third-party integrations, create `.env.local`:

```bash
# Optional: Google Gemini AI (Enables AI Review, Hints, and Test Case Generation)
GEMINI_API_KEY="AIzaSy..."

# Optional: Google OAuth 2.0 (Enables one-click Google Sign-in)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Optional: Custom JWT Secret for session signing
JWT_SECRET="your-custom-secure-jwt-secret-key"

# Optional: Auto-promote specific emails to Admin on Google Login
ADMIN_EMAILS="admin@example.com,lead@example.com"
```

---

## 8. Verification & Performance Benchmarks
- **Compilation & Execution Speed**: Typical C++ test case runs in 15–40ms; Python in 30–60ms.
- **Type Safety**: 100% TypeScript compilation (`tsc --noEmit` exit code 0).
- **Responsive Layout**: Designed for 1920×1080 desktops down to 375px mobile screens.
