# GetThatLatin

A 100% client-side GWA forecaster, custom curriculum builder, and Latin Honors simulator built for **USTP (University of Science and Technology of Southern Philippines)** students—both regular and irregular.

## Features

- **Custom Curriculum Builder (Regular & Irregular Students)**: Add subjects semester-by-semester and add extra academic years (`1st Year` – `5th+ Year`) or Midyear/Summer terms freely.
- **USTP GWA & RA 9163 Engine**: Computes unit-weighted GWA across `1.00–3.00` (`0.25` step) grades, flags `5.00` (failing) and `INC` disqualifiers, and supports instant switching between **Exclude NSTP** (RA 9163 Latin Honors GWA) and **Include All**.
- **Target Boundary Solver**: Solves the exact grade average required across remaining ungraded units to reach **Summa Cum Laude** (`≤ 1.2500`), **Magna Cum Laude** (`≤ 1.5000`), or **Cum Laude** (`≤ 1.7500`).
- **What-If Grade Tester**: Test hypothetical grades on any ungraded subject with live sliders and dropdowns.
- **Monte Carlo Probability Simulator**: Runs `25,000–50,000` Box–Muller Gaussian simulations in a dedicated **Web Worker** at 60 FPS to estimate your graduation honors probabilities.
- **100% Private & Offline-First**: All records stay in your browser (`localStorage` under `getthatlatin_records_v1`) with one-click JSON backup and restore.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Web Workers**
- **Zod** + **Vitest**

## Local Development

```bash
npm install
npm run dev
```

## Build & Test

```bash
npm test
npm run build
npm run preview
```

## Deploying to Vercel

This repository includes a preconfigured [`vercel.json`](./vercel.json) with SPA rewrites, immutable asset caching, and security headers. Import the GitHub repository into Vercel and deploy with the default **Vite** preset (`npm run build`, output directory `dist`).
