$ErrorActionPreference = "Stop"

$postgresBin = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"
$dataDir = Join-Path $PSScriptRoot "..\.postgres-data"
$logFile = Join-Path $PSScriptRoot "..\.postgres.log"

& $postgresBin -D $dataDir -l $logFile -o " -p 5433" start
