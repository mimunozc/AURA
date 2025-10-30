Set-StrictMode -Version Latest
param([string]$mode = "local")

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\frontend"

if ($mode -eq "lan") {
    $env:NEXT_PUBLIC_API_URL = "http://192.168.18.142:8001"
    $env:NEXT_PUBLIC_AI_URL  = "http://192.168.18.142:8002"
    $env:PORT = "3000"
    npm install
    npm run dev:host
} else {
    $env:NEXT_PUBLIC_API_URL = "http://localhost:8001"
    $env:NEXT_PUBLIC_AI_URL  = "http://localhost:8002"
    $env:PORT = "3000"
    npm install
    npm run dev
}
