Set-StrictMode -Version Latest
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$root\api\src\Aura.WebApi"

$env:ASPNETCORE_URLS = "http://0.0.0.0:8001"
$env:Ai__BaseUrl     = "http://localhost:8002"
$env:Auth__JwtKey    = "aura_dev_super_secret_key_32+_chars_1234567890abcd"

dotnet restore
dotnet build
dotnet run
