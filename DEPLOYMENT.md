# Deployment Guide (Vercel)

This guide explains how to deploy your **Focus Split** app to the internet using Vercel, and how to install it on your mobile device.

## Prerequisites
- A GitHub account (you already have one).
- The code pushed to GitHub (already done: `disguide/Anti-procrastination-calendar-V4`).

## Step 1: Deploy to Vercel

1.  Go to [vercel.com](https://vercel.com/signup) and Sign Up (continue with **GitHub**).
2.  Once logged in, look for the **"Add New..."** button and select **Project**.
3.  You will see a list of your GitHub repositories. Find **`Anti-procrastination-calendar-V4`** and click **Import**.
4.  **Configure Project**:
    - **Framework Preset**: Vercel should auto-detect "Vite" or "Create React App". If not, select **Vite**.
    - **Root Directory**: Leave as `./`.
    - **Build Command**: `npm run build` (default).
    - **Output Directory**: `dist` (default).
5.  Click **Deploy**.

Vercel will build your app. In about a minute, you will get a **Production URL** (e.g., `anti-procrastination-calendar.vercel.app`).

## Step 2: Install on Mobile (PWA)

Now that your app has a real URL (https://...), you can install it on your phone.

### iOS (iPhone/iPad)
1.  Open **Safari** on your device.
2.  Visit your new Vercel URL.
3.  Tap the **Share** button (square with arrow pointing up).
4.  Scroll down and tap **Add to Home Screen**.
5.  Tap **Add**.
    *   *Result*: The app appears on your home screen with the correct icon and runs in full-screen mode.

### Android
1.  Open **Chrome** on your device.
2.  Visit your new Vercel URL.
3.  Tap the **Menu** button (three vertical dots).
4.  Tap **Install App** or **Add to Home screen**.
5.  Confirm by tapping **Install**.
    *   *Result*: The app appears in your app drawer and home screen.

## Step 3: Updating the App
Since you connected Vercel to GitHub, **updates are automatic**.
Whenever you push new code to the `master` branch on GitHub:
1.  Vercel detects the change.
2.  It automatically rebuilds and deploys the new version.
3.  Users (you) will see the new version after refreshing the app.
