# Deployment & Workflow Guide

This guide explains how to deploy your application to Firebase Hosting and maintain a development workflow.

https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https://www.googleapis.com/auth/cloud-platform%20https://www.googleapis.com/auth/userinfo.email%20https://www.googleapis.com/auth/userinfo.profile&code_challenge_method=S256&code_challenge=51I6Vn0XK-j3nnflgTaPdBbDkZwZEGZqjt_ylBr8w9E&state=dfe289d0-7902-4979-9e49-0d5ebfaf4d03&response_type=code&client_id=681255809395-oo8ft2oprdrnp9e3aqf6av3hmdib135j.apps.googleusercontent.com&redirect_uri=http://localhost:61246/oauth2redirect

## 1. Prerequisites

First, ensure you have the Firebase CLI installed. It is best to install this globally or just use `npx`.

```bash
npm install -g firebase-tools
```

## 2. One-Time Setup

Before your first deployment, you need to log in and initialize the project.

1.  **Login to Firebase**
    ```bash
    firebase login
    ```
    *This will open a browser window to authenticate.*

2.  **Initialize Hosting**
    ```bash
    firebase init hosting
    ```
    *   **Select Project**: Choose `Use an existing project` and select `daman-system`.
    *   **Public Directory**: Type `src` (or `public` or `build`, depending on where your HTML entry point is). *For this basic setup, ensure you put your `index.html` in the folder you select.*
    *   **Single Page App**: Type `Yes` if you are building a SPA (React/Vue/etc), `No` for simple static sites.
    *   **Automatic Builds**: `No` (unless you want GitHub Actions setup).

## 3. "Realtime Sync" (Local Development)

To work on your project and see changes immediately without deploying to the live server (Realtime Sync):

```bash
firebase emulators:start
# OR
firebase serve
```

*   This starts a local server (usually `http://localhost:5000`).
*   Any changes you save to your files will reflect here instantly (refreshing might be required unless a hot-loader is set up).

## 4. "Push" (Deploy to Production)

When you are ready to update the live website "daman-system.web.app":

```bash
firebase deploy
```

This command uploads your specified public directory to Firebase Hosting.

## 5. "Pull" (Update Workspace)

**Important**: Firebase Hosting is **NOT** a source control system (like GitHub). You cannot "pull" the source code from Firebase Hosting back to your computer.

*   **To sync code between computers**: You **MUST** use Git (GitHub/GitLab).
    *   **Push code**: `git push origin main`
    *   **Pull code**: `git pull origin main`

*   **To sync data**: If you need to import/export Firestore or Database data:
    *   **Pull Data**: `firebase firestore:delete --all-collections` (Caution) or use the Google Cloud Console to export.
    *   However, for development, rely on the **Emulators** which can import/export data snapshots:
        ```bash
        firebase emulators:start --import=./my-data-dir --export-on-exit
        ```

## Summary of Commands

| Action | Command |
| :--- | :--- |
| **Start Dev Server** | `firebase emulators:start` |
| **Deploy (Push)** | `firebase deploy` |
| **Login** | `firebase login` |

