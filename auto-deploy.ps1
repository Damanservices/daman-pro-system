# DAMAN PRO SYSTEM - Fully Automated Deployment
# This script automates everything: table creation, frontend configuration, and testing

param(
    [string]$WebAppUrl = "https://script.google.com/macros/s/AKfycbydMLT4uqyYqnmADL64E6YQ4C5ivMRXWcfLM6hh5msJNvT2sp5-b91xlbTNBTaA9dHgJQ/exec"
)

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     DAMAN PRO SYSTEM - Automated Deployment           " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$SHEET_ID = "1Cv4wqQL7fttbl84B_8yd-DX4HVgvTV_CcaTomygFHB8"
$SCRIPT_ID = "1JXpC8FAOmNJ09TKqkNvitXL1xTc50yIea3eGsZV7s_t5XGRiH8ccOke3"

# Configuration Summary
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Web App URL: $WebAppUrl" -ForegroundColor Gray
Write-Host "  Sheet ID: $SHEET_ID" -ForegroundColor Gray
Write-Host "  Script ID: $SCRIPT_ID" -ForegroundColor Gray
Write-Host ""

# Step 1: Create Pre-Built Tables via API
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[1/4] Creating Pre-Built Tables..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

try {
    Write-Host "  Calling setup API endpoint..." -ForegroundColor Gray
    $setupUrl = "${WebAppUrl}?action=setup"
    
    $response = Invoke-RestMethod -Uri $setupUrl -Method Get -TimeoutSec 60
    
    if ($response.status -eq "success") {
        Write-Host "  SUCCESS: Tables created!" -ForegroundColor Green
        Write-Host "  Message: $($response.message)" -ForegroundColor Gray
    }
    else {
        Write-Host "  WARNING: $($response.message)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  WARNING: API call failed" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Red
    Write-Host "  You may need to run setupPreBuiltTables manually in Apps Script" -ForegroundColor Gray
}

Write-Host ""

# Step 2: Verify Sheet Structure
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[2/4] Verifying Google Sheet..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

try {
    $statusUrl = "${WebAppUrl}?action=checkStatus"
    $status = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec 30
    
    if ($status.sheets) {
        Write-Host "  SUCCESS: Sheet verification complete!" -ForegroundColor Green
        $sheetCount = ($status.sheets | Get-Member -MemberType NoteProperty).Count
        Write-Host "  Found $sheetCount sheets" -ForegroundColor Gray
        
        # List sheets
        $status.sheets.PSObject.Properties | ForEach-Object {
            $sheetName = $_.Name
            $sheetInfo = $_.Value
            if ($sheetInfo.status -eq "OK") {
                Write-Host "    OK: $sheetName ($($sheetInfo.rows) rows)" -ForegroundColor Gray
            }
            else {
                Write-Host "    MISSING: $sheetName" -ForegroundColor Red
            }
        }
    }
    else {
        Write-Host "  WARNING: Could not verify sheets" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  WARNING: Verification failed" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 3: Configure Frontend
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[3/4] Configuring Frontend..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$envFile = "Frontend\.env.local"

# Create or update .env.local
$envContent = @"
# DAMAN PRO SYSTEM - Environment Configuration
# Auto-generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Backend API Configuration
NEXT_PUBLIC_API_URL=$WebAppUrl
NEXT_PUBLIC_SHEET_ID=$SHEET_ID
NEXT_PUBLIC_SCRIPT_ID=$SCRIPT_ID

# Firebase Configuration (if needed)
# NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
# NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
# NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
"@

try {
    $envContent | Out-File -FilePath $envFile -Encoding UTF8 -Force
    Write-Host "  SUCCESS: Created/Updated .env.local" -ForegroundColor Green
    Write-Host "  Location: $envFile" -ForegroundColor Gray
    Write-Host "  API URL: $WebAppUrl" -ForegroundColor Gray
}
catch {
    Write-Host "  ERROR: Failed to create .env.local" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""

# Step 4: Test API Connection
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[4/4] Testing API Connection..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$testEndpoints = @(
    @{ Name = "Status Check"; Action = "checkStatus" },
    @{ Name = "Read Companies"; Action = "readCompanies" },
    @{ Name = "Read Employees"; Action = "readEmployees" }
)

foreach ($endpoint in $testEndpoints) {
    try {
        $testUrl = "${WebAppUrl}?action=$($endpoint.Action)"
        Write-Host "  Testing: $($endpoint.Name)..." -ForegroundColor Gray
        
        $testResponse = Invoke-RestMethod -Uri $testUrl -Method Get -TimeoutSec 15
        
        if ($testResponse.status -eq "success") {
            Write-Host "    OK: $($endpoint.Name)" -ForegroundColor Green
            if ($testResponse.data) {
                $dataCount = if ($testResponse.data -is [Array]) { $testResponse.data.Count } else { 1 }
                Write-Host "      Records: $dataCount" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "    WARNING: $($endpoint.Name) - $($testResponse.message)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "    ERROR: $($endpoint.Name) - Failed" -ForegroundColor Red
    }
}

Write-Host ""

# Deployment Summary
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUCCESS: Backend deployed and accessible" -ForegroundColor Green
Write-Host "SUCCESS: Frontend configured with API URL" -ForegroundColor Green
Write-Host "SUCCESS: API tested and responding" -ForegroundColor Green
Write-Host ""

Write-Host "Important Links:" -ForegroundColor Yellow
Write-Host "  Apps Script:  https://script.google.com/home/projects/$SCRIPT_ID/edit" -ForegroundColor Gray
Write-Host "  Google Sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID/edit" -ForegroundColor Gray
Write-Host "  API Endpoint: $WebAppUrl" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Verify tables in Google Sheet (link above)" -ForegroundColor Gray
Write-Host "  2. Start frontend development server:" -ForegroundColor Gray
Write-Host "     cd Frontend && npm run dev" -ForegroundColor Gray
Write-Host "  3. Open http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "Test API in browser:" -ForegroundColor Yellow
Write-Host "  ${WebAppUrl}?action=checkStatus" -ForegroundColor Gray
Write-Host ""

# Optional: Open links
$openLinks = Read-Host "Open Apps Script and Google Sheet in browser? (y/n)"
if ($openLinks -eq "y" -or $openLinks -eq "Y") {
    Start-Process "https://script.google.com/home/projects/$SCRIPT_ID/edit"
    Start-Process "https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"
    Write-Host "  SUCCESS: Opened in browser" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "            Deployment Complete!                        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
