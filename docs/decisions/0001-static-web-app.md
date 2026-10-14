# 0001: Static web app with no backend

Date: 2026-10-14. Status: accepted.

## Decision

HSK Reader is a static React + TypeScript app built with Vite. All word data ships as JSON
files and every step (segmentation, lookup, Anki export) runs in the browser. Saved words and
settings live in the browser's local storage.

## Why

- Free to host on Vercel, nothing to operate.
- Works on a phone browser, which is the main way the app is used.
- Articles never leave the device.

Amended by [0003](0003-server-side-article-fetch.md): one serverless function fetches article links.

## Revisit when

We need sync between devices, user accounts, or data too large to ship to the browser.
