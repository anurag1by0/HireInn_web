
Write-Host "Step 1: Terminating lingering Python processes to release file locks..."
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Step 2: Nuke 'bson' and 'pymongo' directories from site-packages..."
$site_packages = ".\venv\Lib\site-packages"
if (Test-Path "$site_packages\bson") {
    Write-Host "Removing $site_packages\bson"
    Remove-Item -Recurse -Force "$site_packages\bson" -ErrorAction SilentlyContinue
}
if (Test-Path "$site_packages\pymongo") {
    Write-Host "Removing $site_packages\pymongo"
    Remove-Item -Recurse -Force "$site_packages\pymongo" -ErrorAction SilentlyContinue
}

Write-Host "Step 3: Reinstalling dependencies (pymongo, motor, pydantic v1)..."
.\venv\Scripts\python -m pip install --force-reinstall pymongo motor "pydantic<2.0.0"
.\venv\Scripts\python -m pip install python-jobspy pandas supabase fastapi uvicorn python-dotenv dnspython

Write-Host "Dependency fix complete."
