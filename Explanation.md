# Prism – Image Resizer: Detailed Explanation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Frontend (client/)](#4-frontend-client)
   - 4.1 [Technology Stack](#41-technology-stack)
   - 4.2 [Entry Points](#42-entry-points)
   - 4.3 [Components](#43-components)
   - 4.4 [Styling System](#44-styling-system)
   - 4.5 [Build Tooling](#45-build-tooling)
5. [Backend (server/)](#5-backend-server)
   - 5.1 [Technology Stack](#51-technology-stack)
   - 5.2 [Express Application](#52-express-application)
   - 5.3 [Middleware: File Upload](#53-middleware-file-upload)
   - 5.4 [AWS S3 Configuration](#54-aws-s3-configuration)
   - 5.5 [API Endpoints](#55-api-endpoints)
6. [Image Resizing Pipeline](#6-image-resizing-pipeline)
   - 6.1 [Sharp Library](#61-sharp-library)
   - 6.2 [Resize Variants & Quality Settings](#62-resize-variants--quality-settings)
   - 6.3 [Pipeline Flow Diagram](#63-pipeline-flow-diagram)
7. [Data Storage](#7-data-storage)
8. [Configuration & Environment Variables](#8-configuration--environment-variables)
9. [Main User Flow](#9-main-user-flow)
10. [How to Run, Build, and Deploy](#10-how-to-run-build-and-deploy)
    - 10.1 [Prerequisites](#101-prerequisites)
    - 10.2 [Environment Setup](#102-environment-setup)
    - 10.3 [Running the Backend](#103-running-the-backend)
    - 10.4 [Running the Frontend](#104-running-the-frontend)
    - 10.5 [Production Build](#105-production-build)
11. [Error Handling](#11-error-handling)
12. [Performance Considerations](#12-performance-considerations)
13. [Security Considerations](#13-security-considerations)
14. [Known Limitations & Future Improvements](#14-known-limitations--future-improvements)

---

## 1. Project Overview

**Prism** is a full-stack web application that lets users upload images and automatically receive three optimised, resized variants (thumbnail, medium, and large) in modern WebP format. The processed files are stored in AWS S3 and can be previewed and downloaded directly from the UI.

Key goals:

- Reduce image file sizes significantly through format conversion (original → WebP) and dimension capping.
- Provide a clean, animated UI that shows a before/after size comparison.
- Persist file references in MongoDB so that processed images can be tracked.

---

## 2. Repository Structure

```
Prism---Image-Resizer/
├── .gitignore               # Root-level ignore rules (node_modules, .env, dist, build, sample_photos)
├── README.md                # Minimal project readme
├── Explanation.md           # This file
│
├── client/                  # React + Vite frontend
│   ├── index.html           # Single HTML shell with Google Fonts link
│   ├── package.json         # Frontend dependencies and scripts
│   ├── package-lock.json
│   ├── vite.config.js       # Vite build configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS config (Tailwind plugin)
│   ├── eslint.config.js     # ESLint flat config
│   └── src/
│       ├── main.jsx         # React entry point (ReactDOM.createRoot)
│       ├── App.jsx          # Root component; holds all shared state
│       ├── index.css        # Global CSS, custom keyframes, Prism button styles, font-face rules
│       ├── App.css          # Tailwind base/components/utilities import
│       ├── assets/          # Static assets
│       │   ├── hero.png
│       │   ├── react.svg
│       │   ├── vite.svg
│       │   ├── struggle-regular.woff / .woff2
│       │   └── struggle-rotalics.woff / .woff2
│       └── components/
│           ├── AnimatingBG.jsx   # Animated gradient background wrapper
│           ├── Header.jsx        # Page title/branding
│           ├── UploadZone.jsx    # Drag-and-drop / click-to-upload area
│           ├── ResizeSlider.jsx  # Scale percentage slider (UI only)
│           ├── PrismButton.jsx   # Styled submit button with loading state
│           └── PreviewSection.jsx# Side-by-side original vs. optimised preview + download
│
└── server/                  # Node.js + Express backend
    ├── package.json         # Backend dependencies
    ├── package-lock.json
    ├── server.js            # Main Express app (routes, Sharp pipeline, S3 uploads)
    ├── config/
    │   └── s3.js            # AWS S3Client initialisation
    └── middlewares/
        └── upload.js        # Multer memory-storage middleware
```

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (User)                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  React SPA  (Vite dev server :5173 / static build)           │   │
│  │                                                              │   │
│  │  UploadZone → App state → PrismButton → fetch POST /upload   │   │
│  │                                     ↘                        │   │
│  │  PreviewSection ← resized S3 URL ←── response JSON           │   │
│  │       └─ Download button → GET /download?key=...             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                           │  HTTP/REST                              │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
            ┌───────────────▼───────────────┐
            │  Express Server  (:5000)       │
            │                               │
            │  POST /api/upload             │
            │   └─ multer (memory)          │
            │   └─ sharp: 3 variants        │
            │   └─ S3 PutObjectCommand ×3   │
            │                               │
            │  GET /api/download            │
            │   └─ S3 GetObjectCommand      │
            │   └─ stream → response        │
            └───────┬───────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
   ┌────▼────┐          ┌──────▼──────┐
   │ AWS S3  │          │  MongoDB    │
   │ Bucket  │          │  (connected,│
   │ (WebP   │          │  not yet    │
   │  files) │          │  used for   │
   └─────────┘          │  queries)   │
                        └─────────────┘
```

The frontend and backend are completely decoupled. The frontend communicates with the backend exclusively via HTTP REST calls. Static assets are served separately (Vite dev server in development, any static host in production).

---

## 4. Frontend (client/)

### 4.1 Technology Stack

| Technology | Version | Role |
|---|---|---|
| React | ^19.2.4 | UI component library |
| Vite | ^8.0.1 | Dev server & bundler |
| Tailwind CSS | ^4.2.2 | Utility-first CSS framework |
| PostCSS | ^8.5.8 | CSS processing (Tailwind plugin) |
| ESLint | ^9.39.4 | Linting (flat config) |
| Google Fonts (Sono) | runtime CDN | Primary display font |

### 4.2 Entry Points

**`client/index.html`**  
The single HTML page loaded by the browser. Notable inclusions:
- Google Fonts preconnect + stylesheet link for the *Sono* variable font (weights 200–800, variable MONO axis).
- `<div id="root">` — mount point for the React tree.
- `<script type="module" src="/src/main.jsx">` — Vite-served ES module entry.

**`client/src/main.jsx`**  
Bootstraps React with `createRoot` in `StrictMode`. Imports `index.css` for global styles and renders `<App />`.

### 4.3 Components

All components live in `client/src/components/`.

---

#### `App.jsx` — Root Component

The single source of truth for shared state. Renders all other components and orchestrates the upload flow.

**State variables:**

| Variable | Type | Purpose |
|---|---|---|
| `scale` | number (1–100) | Current slider value (percentage); sent to the UI but not yet forwarded to the backend resize logic |
| `original` | string \| null | Object URL of the locally selected file for the "Original" preview |
| `resized` | string \| null | Public S3 URL of the processed large variant |
| `processing` | boolean | Controls the shimmer animation in `PreviewSection` |
| `file` | File \| null | Raw browser `File` object to be uploaded |
| `loading` | boolean | Controls the spinner inside `PrismButton` |
| `sizeInfo` | object \| null | `{ original, large, medium, thumbnail }` byte counts returned by the server |

**Key function — `handleProcess`:**

```
1. Guard: return early if no file is selected
2. Set loading=true, processing=true
3. Build a FormData with the file under the key "image"
4. POST to http://localhost:5000/api/upload
5. On success:
     - Store sizeInfo from response
     - Build the S3 public URL (hardcoded base URL + data.files.large)
     - Set resized state to that URL
6. On error: log to console
7. Set processing=false, loading=false
```

> **Note:** The `scale` slider value is maintained in state and shown in the UI but is **not** currently sent to the server. The server always generates fixed-breakpoint variants (320 / 768 / 1280 px). This is a known gap — see [§14](#14-known-limitations--future-improvements).

---

#### `AnimatingBG.jsx` — Animated Gradient Background

A pure CSS visual wrapper component. Injects a `<style>` block and renders four floating "orb" divs plus a subtle glass grid overlay.

- **Background base:** `#080810` (near-black).
- **Orbs:** Four absolutely-positioned circles with `filter: blur(100px)` and CSS `@keyframes` drift animations (14 s, 17 s, 20 s, 12 s). Uses `radial-gradient` with deep purple and blue tones.
- **Glass grid:** `linear-gradient` crosshatch at 60 px spacing, 1.5% white opacity — creates a subtle depth cue.
- **Noise texture:** SVG `feTurbulence` filter baked into a `data:` URI, overlaid at 4% opacity for a film-grain effect.

All interactive content is rendered inside a `<div class="content">` with `z-index: 1`, placed above the decorative layers.

---

#### `Header.jsx` — Page Title

Stateless. Renders an `<h1>` with the text **"Prism - Image Resizer"** using the `font-sono` Tailwind class and custom tracking/weight settings.

---

#### `UploadZone.jsx` — File Input Area

Handles both click-to-browse and drag-and-drop file selection.

**Internal state:**
- `dragging` — highlights the zone blue with a bounce animation while a file is dragged over it.
- `fileName` — stores the selected file's name to switch the icon from an upload arrow to a green checkmark.

**Props:**
- `setFile(file)` — lifts the raw `File` object to `App`.
- `setOriginal(url)` — lifts a `URL.createObjectURL(file)` string to `App` for the preview.

**Supported formats:** Any `image/*` MIME type (enforced by the `<input accept="image/*">`). The placeholder text mentions PNG, JPG, and WebP explicitly.

**Visual states:**

| Condition | Border | Background |
|---|---|---|
| Default | `white/10` | `black/40` |
| File selected | `green-400/40` | `green-500/5` |
| Dragging over | `blue-400` | `blue-500/10` |

---

#### `ResizeSlider.jsx` — Scale Percentage Slider

A thin wrapper around `<input type="range">`. Displays the current percentage in a monospace badge.

**Props:** `value` (number, 1–100), `onChange` (event handler passed up to `App`).

> As noted above, this value is held in `App` state but not forwarded to the backend in the current implementation.

---

#### `PrismButton.jsx` — Styled Submit Button

A button with a gradient border effect achieved via a wrapper `<div class="prism-container">`.

**Props:**
- `onClick` — triggers `handleProcess` in `App`.
- `disabled` — `true` when no file is selected.
- `loading` — swaps the label for a spinning SVG icon and "Processing…" text.

**CSS classes** (defined in `index.css`):
- `.prism-container` — 2 px padding, `border-radius: 0.9em`, gradient background (`#2563eb` → `#06b6d4`).
- `.prism-container:hover::before` — same gradient blurred by `1em` to create a glow.
- `.prism-button` — inner dark button (`rgba(10,15,30,0.9)`) with `backdrop-filter: blur(6px)`.

---

#### `PreviewSection.jsx` — Before / After Comparison

Renders two 112×112 px thumbnail cards separated by a gradient arrow divider.

**Left card — Original:**  
Shows the `originalImage` object URL. Counts up the byte size with the `useCountUp` hook.

**Right card — Optimised:**  
- While `isProcessing` is `true`: displays a `shimmer` sweep animation.
- When `resizedImage` is set: shows the S3 URL image with a blur-to-clear CSS transition on load (`blur-md scale-105 opacity-50` → `blur-0 scale-100 opacity-100`).
- Shows the byte count of the `large` variant with `useCountUp`.
- Renders a **Download** link that opens `http://localhost:5000/api/download?key=<s3-key>` in a new tab, extracting the key from the S3 URL by splitting on `.amazonaws.com/`.

**Helper functions:**
- `useCountUp(target, duration)` — custom React hook that animates a number from 0 to `target` over `duration` ms (default 800 ms) using `setInterval` at ~60 fps.
- `formatSize(bytes)` / `formatFromRaw(bytes, raw)` — convert raw byte counts to human-readable B / KB / MB strings using the `raw` value to decide the unit.

### 4.4 Styling System

**`index.css`** is the main stylesheet, imported once in `main.jsx`. Key sections:

| Section | Purpose |
|---|---|
| `:root` CSS variables | Colour tokens, font stacks, responsive font size |
| `@media (prefers-color-scheme: dark)` | Dark mode token overrides |
| `body` | Sets `font-family: 'Sono', sans-serif` globally |
| `.liquid-upload-zone` | Glassmorphism effect for the upload card (backdrop-filter + inset box-shadow) |
| `@keyframes shimmer` | Translates an overlay from -100% to 100% for the processing shimmer |
| `@keyframes fadeIn` | Opacity 0→1 for image reveal |
| `.prism-container` / `.prism-button` | Gradient-border button styles |
| `@font-face` | Registers the *Struggle* display font (woff/woff2) from `assets/` |

**`tailwind.config.js`** extends the default Tailwind theme with:
```js
fontFamily: {
  sono: ['sono', 'sans-serif'],
}
```
Content paths: `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`.

**`postcss.config.js`** uses the `@tailwindcss/postcss` plugin (Tailwind v4 integration).

### 4.5 Build Tooling

**`vite.config.js`** — minimal Vite config, enabling the `@vitejs/plugin-react` plugin (uses Babel for JSX transformation and React Fast Refresh in dev).

**ESLint** (`eslint.config.js`) — flat config format (ESLint v9+):
- Applies `eslint:recommended`, `react-hooks/recommended`, and `react-refresh/vite` presets.
- Custom rule: `no-unused-vars` allows identifiers starting with an uppercase letter or underscore (suppresses false positives from imported-but-not-yet-used React component types).

Available npm scripts (`client/package.json`):

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Start hot-reload dev server (default port 5173) |
| `build` | `vite build` | Produce optimised static bundle in `dist/` |
| `preview` | `vite preview` | Serve the production build locally |
| `lint` | `eslint .` | Run ESLint across all JS/JSX files |

---

## 5. Backend (server/)

### 5.1 Technology Stack

| Technology | Version | Role |
|---|---|---|
| Node.js | LTS (implied) | Runtime |
| Express | ^5.2.1 | HTTP framework |
| Sharp | ^0.34.5 | Image processing (resize + WebP encode) |
| Multer | ^2.1.1 | Multipart form-data parsing |
| `@aws-sdk/client-s3` | ^3.1016.0 | AWS S3 v3 SDK |
| Mongoose | ^9.3.2 | MongoDB ODM |
| dotenv | ^17.3.1 | Loads `.env` file into `process.env` |
| cors | ^2.8.6 | Permissive CORS middleware |

### 5.2 Express Application

**`server/server.js`** is the single file that wires everything together:

1. Loads environment variables from a `.env` file one directory up (`path: '../.env'`).
2. Creates an Express app with `cors()` enabled globally (all origins).
3. Connects to MongoDB via `mongoose.connect(process.env.MONGODB_URI)`.
4. Registers the upload and download routes.
5. Starts listening on `process.env.PORT` (default `5000`).

### 5.3 Middleware: File Upload

**`server/middlewares/upload.js`**

```js
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
module.exports = upload
```

Multer is configured with **in-memory storage** (`memoryStorage`). The uploaded file is never written to disk; instead it lands in `req.file.buffer` as a `Buffer` object. This is ideal for a pipeline that immediately passes the data to Sharp — no temporary file cleanup is needed. However, it means the entire file must fit in Node.js heap memory.

### 5.4 AWS S3 Configuration

**`server/config/s3.js`**

```js
const { S3Client } = require('@aws-sdk/client-s3')

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

module.exports = s3
```

Creates and exports a single `S3Client` instance using AWS SDK v3. The client is reused across all requests (module-level singleton).

### 5.5 API Endpoints

#### `POST /api/upload`

Accepts a multipart form-data request with a single file field named `"image"`.

**Request:** `multipart/form-data` — field `image` containing the image binary.  
**Response (200):**
```json
{
  "message": "Upload + optimization successful",
  "files": {
    "thumbnail": "thumb-<timestamp>.webp",
    "medium":    "medium-<timestamp>.webp",
    "large":     "large-<timestamp>.webp"
  },
  "sizes": {
    "original":  <bytes>,
    "thumbnail": <bytes>,
    "medium":    <bytes>,
    "large":     <bytes>
  }
}
```
**Response (400):** `{ "error": "No file uploaded" }` — when no file field is present.  
**Response (500):** `{ "error": "Upload Failed", "detail": "<error message>" }` — for Sharp or S3 errors.

---

#### `GET /api/download`

Streams a stored file from S3 directly to the client.

**Query parameter:** `key` — the S3 object key (e.g., `large-1718000000000.webp`).  
**Response (200):** Binary stream with headers:
```
Content-Disposition: attachment; filename="<key>"
Content-Type: image/webp
```
The S3 response body (`s3Response.Body`, a `ReadableStream`) is wrapped with Node.js `Readable.from()` and piped to the HTTP response.

**Response (400):** `{ "error": "No key provided" }` — missing query param.  
**Response (500):** `{ "error": "Download failed" }` — S3 retrieval error.

---

## 6. Image Resizing Pipeline

### 6.1 Sharp Library

[Sharp](https://sharp.pixelplumbing.com/) is a high-performance Node.js image processing library built on top of **libvips**. It operates entirely in native code, making it significantly faster than pure-JavaScript or canvas-based alternatives. Key characteristics:

- Streams/Buffers: Sharp can read from and write to Node.js `Buffer` objects — perfect for Multer's in-memory storage.
- Lazy evaluation: operations are chained and executed in a single pass over the image data.
- WebP encoding: Sharp uses libvips' built-in WebP encoder, which produces smaller files than JPEG/PNG for most photographic content.

### 6.2 Resize Variants & Quality Settings

The upload handler first calls `sharp(file.buffer).metadata()` to read the original image dimensions without decoding the full pixel data.

Three variants are then created in parallel (logically — they share the same source buffer):

| Variant | S3 Key Prefix | Max Width | WebP Quality | Typical Use Case |
|---|---|---|---|---|
| Thumbnail | `thumb-` | 320 px | 70 | Icon, list view, social share |
| Medium | `medium-` | 768 px | 80 | Blog post, mobile view |
| Large | `large-` | 1280 px | 85 | Desktop hero, download |

The resize call uses Sharp's default **fit strategy** (`cover`/`contain` are not specified, so Sharp defaults to `fit: 'cover'` when only `width` is given — maintaining aspect ratio by resizing so the width matches while height scales proportionally).

```js
sharp(file.buffer)
  .resize({ width: metadata.width > 320 ? 320 : metadata.width })
  .webp({ quality: 70 })
  .toBuffer()
```

The `width` guard (`metadata.width > 320 ? 320 : metadata.width`) ensures images are never *upscaled* — if the source is already smaller than the target breakpoint, it retains its original size.

### 6.3 Pipeline Flow Diagram

```
Client Browser
     │
     │  POST /api/upload  (multipart/form-data, field: "image")
     ▼
┌──────────────────────────────────────────────────────────────┐
│  Express Route  POST /api/upload                             │
│                                                              │
│  1. multer.single('image')                                   │
│     └─ req.file.buffer  ←── in-memory Buffer                 │
│                                                              │
│  2. sharp(buffer).metadata()                                 │
│     └─ { width, height, format, ... }                        │
│                                                              │
│  3. baseName = Date.now()  (Unix ms timestamp)               │
│                                                              │
│  4a. sharp(buffer).resize({width: min(320, orig)})           │
│       .webp({quality: 70}).toBuffer()   → thumbnail Buffer   │
│                                                              │
│  4b. sharp(buffer).resize({width: min(768, orig)})           │
│       .webp({quality: 80}).toBuffer()   → medium Buffer      │
│                                                              │
│  4c. sharp(buffer).resize({width: min(1280, orig)})          │
│       .webp({quality: 85}).toBuffer()   → large Buffer       │
│                                                              │
│  5a. S3 PutObject  Key: "thumb-{baseName}.webp"              │
│  5b. S3 PutObject  Key: "medium-{baseName}.webp"             │
│  5c. S3 PutObject  Key: "large-{baseName}.webp"              │
│                                                              │
│  6.  res.json({ message, files, sizes })                     │
└──────────────────────────────────────────────────────────────┘
     │
     │  JSON response (keys + byte sizes)
     ▼
Client updates state:
  resized = S3_BASE_URL + data.files.large
  sizeInfo = { original, large, medium, thumbnail }
```

---

## 7. Data Storage

### AWS S3

Processed images are stored in a single S3 bucket defined by `process.env.S3_BUCKET`. The bucket must be configured for public read access if the frontend is to display the image from a direct S3 URL (the current implementation uses a hardcoded public base URL `https://prism-resizer.s3.ap-south-1.amazonaws.com/`).

Object naming convention: `<variant>-<Date.now()>.webp`  
Example: `thumb-1718123456789.webp`

Using `Date.now()` as a base name means:
- Keys are roughly chronological.
- Collisions are theoretically possible under very high concurrency (two uploads within the same millisecond), but practically negligible for a single-user or low-traffic deployment.

### MongoDB

Mongoose is connected at startup (`mongoose.connect(process.env.MONGODB_URI)`). However, **no Mongoose models or schemas are defined** in the current codebase, and MongoDB is not queried in any route handler. The connection is established for future use (e.g., storing upload metadata, user associations, or download counts).

---

## 8. Configuration & Environment Variables

All secrets and deployment-specific values are loaded from a `.env` file located **one directory above `server/`** (i.e., at the repository root: `/Prism---Image-Resizer/.env`). This file is listed in `.gitignore` and must be created manually.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port the Express server listens on |
| `MONGODB_URI` | Yes | — | Full MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/prism`) |
| `AWS_REGION` | Yes | — | AWS region where your S3 bucket lives (e.g., `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | Yes | — | IAM access key with `s3:PutObject` and `s3:GetObject` permissions |
| `AWS_SECRET_ACCESS_KEY` | Yes | — | Corresponding IAM secret key |
| `S3_BUCKET` | Yes | — | S3 bucket name (e.g., `prism-resizer`) |

**Example `.env` file (repository root):**

```dotenv
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/prism
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=prism-resizer
```

### Hardcoded Frontend Values

The frontend also contains a hardcoded value in `client/src/App.jsx`:

```js
const baseUrl = "https://prism-resizer.s3.ap-south-1.amazonaws.com/";
```

This must be updated if you change the bucket name or region. A future improvement would be to expose this as a Vite environment variable (`VITE_S3_BASE_URL`).

Similarly, the API base URL is hardcoded as `http://localhost:5000` in both `App.jsx` (upload) and `PreviewSection.jsx` (download). For a deployed environment this should be extracted to a `VITE_API_URL` variable in a `.env` file at the `client/` level.

---

## 9. Main User Flow

```
User opens app in browser
        │
        ▼
AnimatedGradientBg renders ornamental background
        │
        ▼
UploadZone displayed
        │
  User clicks or drags an image file onto the zone
        │
        ├── setFile(file)      ──► App.file state updated
        └── setOriginal(URL)   ──► App.original = object URL
                                         │
                                         ▼
                                 PreviewSection shows
                                 original image preview
        │
        ▼
User adjusts ResizeSlider (optional, cosmetic only)
        │
        ▼
User clicks "Resize Image" (PrismButton enabled when file != null)
        │
        ▼
handleProcess() fires:
  loading=true, processing=true
        │
        ▼
FormData built, POST sent to /api/upload
        │
     ┌──┴──────────────────────────────┐
     │           Server                │
     │  multer → sharp → S3 upload     │
     │  returns { files, sizes }       │
     └──┬──────────────────────────────┘
        │
        ▼
App receives response:
  setSizeInfo({ original, large, medium, thumbnail })
  setResized(S3 URL of large variant)
        │
        ▼
PreviewSection shows:
  - Resized image (blur-to-clear animation)
  - Animated count-up of byte sizes
  - Download button → GET /api/download?key=large-...
        │
        ▼
User clicks Download
  → Browser opens /api/download?key=...
  → Express streams file from S3
  → Browser saves attachment
```

---

## 10. How to Run, Build, and Deploy

### 10.1 Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9
- An **AWS account** with an S3 bucket and an IAM user/role with the following policy:
  ```json
  {
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::prism-resizer/*"
  }
  ```
- A **MongoDB** instance (Atlas free tier or self-hosted).

### 10.2 Environment Setup

1. Clone the repository.
2. Create a `.env` file at the repository root (see [§8](#8-configuration--environment-variables) for content).

### 10.3 Running the Backend

```bash
cd server
npm install
node server.js
# Server running on port 5000
# MongoDB connected!
```

> There is no `nodemon` or watch script configured by default. For development, install nodemon globally (`npm i -g nodemon`) and run `nodemon server.js`.

### 10.4 Running the Frontend

```bash
cd client
npm install
npm run dev
# ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser. Ensure the backend is running first.

### 10.5 Production Build

**Build the frontend:**

```bash
cd client
npm run build
# Output: client/dist/
```

The `dist/` folder contains the optimised static assets and can be served by any static host (Netlify, Vercel, AWS S3 + CloudFront, Nginx, etc.).

**Preview the production build locally:**

```bash
npm run preview
# ➜  Local:   http://localhost:4173/
```

**Deploy the backend:**

The server is a plain Node.js process. Common deployment targets:

- **Railway / Render / Fly.io** — push the `server/` directory, set environment variables in the platform dashboard.
- **AWS EC2 / ECS** — run `node server.js` behind a process manager (PM2 recommended: `pm2 start server.js`).
- **AWS Lambda** — would require wrapping Express with `serverless-http`, not currently configured.

**Environment variables in production** must be set in the hosting platform's dashboard rather than a `.env` file.

---

## 11. Error Handling

| Layer | Scenario | Response |
|---|---|---|
| Frontend – `UploadZone` | Non-image file dropped | Browser ignores it (the `<input accept="image/*">` filter; no explicit error message shown) |
| Frontend – `handleProcess` | No file selected | Early return (button is disabled) |
| Frontend – `handleProcess` | Server returns non-ok response | `throw new Error(data.detail)` caught by `catch`, logged to console; no user-visible error message |
| Frontend – `handleProcess` | Network failure | Caught, logged to console; no user-visible error message |
| Backend – `POST /api/upload` | No file field in request | `400 { error: 'No file uploaded' }` |
| Backend – `POST /api/upload` | Sharp processing error | `500 { error: 'Upload Failed', detail: err.message }` |
| Backend – `POST /api/upload` | S3 upload error | `500 { error: 'Upload Failed', detail: err.message }` |
| Backend – `GET /api/download` | Missing `key` parameter | `400 { error: 'No key provided' }` |
| Backend – `GET /api/download` | S3 retrieval error | `500 { error: 'Download failed' }` |
| Backend – Startup | MongoDB connection failure | Error logged; server still starts (routes remain active) |

**Gap:** The frontend does not currently display user-facing error messages (toasts, banners) when the upload fails. Errors are only written to the browser console.

---

## 12. Performance Considerations

- **In-memory processing:** The entire uploaded image is held in memory for the duration of processing. For very large images (e.g., RAW files, high-resolution PNGs), this can spike memory usage significantly. Consider adding a file size limit to the Multer configuration:
  ```js
  const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB cap
  ```
- **Sequential Sharp operations:** The three `sharp(...).toBuffer()` calls are `await`ed sequentially in the current code. Wrapping them in `Promise.all` would reduce total processing time:
  ```js
  const [thumbnail, medium, large] = await Promise.all([
    sharp(file.buffer).resize(...).webp({quality: 70}).toBuffer(),
    sharp(file.buffer).resize(...).webp({quality: 80}).toBuffer(),
    sharp(file.buffer).resize(...).webp({quality: 85}).toBuffer(),
  ])
  ```
  Similarly, the three `s3.send(PutObjectCommand)` calls could be parallelised.
- **WebP format:** WebP typically achieves 25–35% smaller file sizes than JPEG at equivalent perceptual quality. The quality ladder (70/80/85) trades off size for visual fidelity across the three variants.
- **No image caching:** Every upload generates new S3 keys via `Date.now()`. Identical images uploaded twice will create separate S3 objects. A content-addressed naming scheme (e.g., SHA-256 hash) would enable deduplication.
- **CORS:** The server enables CORS for all origins (`app.use(cors())`). This is convenient for development but should be locked down to specific domains in production.
- **S3 transfer costs:** The download endpoint streams S3 objects through the Express server to the client. For high-traffic deployments, generating pre-signed S3 URLs and redirecting the client directly to S3 would eliminate egress costs through the server.

---

## 13. Security Considerations

- **Environment variables:** All secrets (AWS keys, MongoDB URI) are loaded from a `.env` file that is excluded from version control via `.gitignore`. Never commit real credentials.
- **IAM least-privilege:** The AWS IAM credentials should only have `s3:PutObject` and `s3:GetObject` on the specific bucket, not `s3:*` or `*`. Avoid using root account keys.
- **No file type validation on the server:** The backend does not verify that the uploaded buffer is actually a valid image before passing it to Sharp. A malicious actor could upload a non-image file. Sharp will throw on unrecognised formats (caught by the `try/catch`), but explicit MIME type whitelisting at the Multer level is recommended:
  ```js
  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      cb(null, allowed.includes(file.mimetype));
    }
  })
  ```
- **No file size limit:** As mentioned in §12, there is no current cap on upload size, which could be exploited for a denial-of-service attack (OOM) or to incur unexpected S3 storage costs.
- **CORS — all origins:** In production, pass an options object to `cors()` restricting `origin` to your frontend domain.
- **S3 bucket public access:** The frontend displays images using public S3 URLs. Ensure the bucket policy does not allow unintended writes from public/unauthenticated principals. If you need to restrict read access, use pre-signed URLs instead.
- **MongoDB URI exposure:** The MongoDB URI contains credentials. Ensure the `.env` file is not accidentally included in Docker images or CI/CD logs.

---

## 14. Known Limitations & Future Improvements

| # | Limitation | Suggested Fix |
|---|---|---|
| 1 | `scale` slider value is not forwarded to the server | Pass the scale percentage to the backend and apply it as an additional resize step |
| 2 | S3 base URL and API base URL are hardcoded in the frontend | Move to `VITE_S3_BASE_URL` and `VITE_API_URL` Vite environment variables |
| 3 | No user-facing error messages | Add toast notifications for upload failures |
| 4 | Sequential Sharp and S3 operations | Parallelise with `Promise.all` |
| 5 | No file size or type validation on the server | Add Multer `limits` and `fileFilter` options |
| 6 | MongoDB is connected but unused | Define a Mongoose schema/model to persist upload records |
| 7 | `Date.now()` key naming allows duplicate uploads | Use SHA-256 hash of the file buffer as the S3 key |
| 8 | Download streams through the server | Return pre-signed S3 URLs to the client for direct download |
| 9 | No test suite | Add unit tests for the Sharp pipeline and integration tests for the API routes |
| 10 | No authentication | Add user accounts so uploads can be associated with individuals |
