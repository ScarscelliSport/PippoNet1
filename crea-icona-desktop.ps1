$progetto = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktop = [Environment]::GetFolderPath("Desktop")
$scorciatoia = Join-Path $desktop "Gestionale Forniture.lnk"

$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut($scorciatoia)
$sc.TargetPath = Join-Path $progetto "avvia-gestionale.bat"
$sc.WorkingDirectory = $progetto
$sc.IconLocation = Join-Path $progetto "app\favicon.ico"
$sc.Description = "Avvia il Gestionale Forniture"
$sc.Save()

Write-Host "Icona creata sul Desktop: Gestionale Forniture"
