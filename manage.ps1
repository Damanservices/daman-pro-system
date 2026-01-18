<#
.SYNOPSIS
    Daman System Management Script
.DESCRIPTION
    A comprehensive script to manage development, deployment, and git operations for the Daman System application.
#>

$LiveUrl = "https://daman-system.web.app/"
# This represents the local emulator port usually, or the specific cloud workstation port if defined
$LocalPort = "http://localhost:3000" 

function Show-Menu {
    Clear-Host
    Write-Host "================ DAMAN SYSTEM MANAGER ================" -ForegroundColor Cyan
    Write-Host "1. Run Localhost (Realtime Sync / Dev Server)" 
    Write-Host "   -> Starts Firebase Emulators. Edits sync automatically."
    Write-Host "2. Deploy to Production"
    Write-Host "   -> Pushes current build to $LiveUrl"
    Write-Host "3. Open Live Server"
    Write-Host "   -> Opens $LiveUrl in browser"
    Write-Host "4. Git Push"
    Write-Host "   -> Commits and pushes changes to remote repository"
    Write-Host "5. Git Pull"
    Write-Host "   -> Pulls latest changes from remote repository"
    Write-Host "6. Git Clone"
    Write-Host "   -> Helper for cloning (Info only)"
    Write-Host "Q. Quit"
    Write-Host "======================================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Select an option"

    switch ($choice) {
        "1" { 
            Write-Host "Starting Local Development Server..." -ForegroundColor Green
            # Using npm script which runs 'firebase emulators:start'
            npm run dev
            Pause
        }
        "2" {
            Write-Host "Deploying to Production..." -ForegroundColor Yellow
            npm run deploy
            Pause
        }
        "3" {
            Write-Host "Opening Live Site: $LiveUrl" -ForegroundColor Green
            Start-Process $LiveUrl
        }
        "4" {
            Write-Host "Pushing to Git..." -ForegroundColor Magenta
            $msg = Read-Host "Enter commit message (default: 'update')"
            if (-not $msg) { $msg = "update" }
            git add .
            git commit -m "$msg"
            npm run git-push
            Pause
        }
        "5" {
            Write-Host "Pulling from Git..." -ForegroundColor Magenta
            npm run git-pull
            Pause
        }
        "6" {
            Write-Host "To clone this repository elsewhere, run:" -ForegroundColor Yellow
            Write-Host "git clone <your-repo-url>"
            Write-Host "(Run this command in the parent directory where you want the folder to appear)"
            Pause
        }
        "Q" { Write-Host "Exiting..."; break }
        default { Write-Host "Invalid selection." -ForegroundColor Red; Start-Sleep -Seconds 1 }
    }
} until ($choice -eq "Q")
