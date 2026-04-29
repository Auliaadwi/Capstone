$ErrorActionPreference = "Stop"

$postgresBin = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dataDir = Join-Path $PSScriptRoot "..\.postgres-data"

& $postgresBin -D $dataDir stop
