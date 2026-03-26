# BreakNet

The frontend repository for BreakNet, built with Vue 3 and Vite.

## Prerequisites

- Node.js (v16 or higher recommended)
- npm

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/FangChanguwu/BreakNet
cd BreakNet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory to configure the environment variables required for local development. Do not commit this file to version control.

```env
VITE_APP_SECRET_KEY=your_secret_key_here
VITE_API_BASE_URL=http://localhost:8000/api
```

### 4. Run Locally

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

After the build process is complete, the compiled assets will be output to the `dist` directory. Deploy the static files within this folder to Nginx or any other web server to go live.
