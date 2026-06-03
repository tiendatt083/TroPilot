$envFilePath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envFilePath) {
    Get-Content $envFilePath | ForEach-Object {
        $line = $_.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith("#")) {
            return
        }

        $separatorIndex = $line.IndexOf("=")
        if ($separatorIndex -le 0) {
            return
        }

        $name = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()
        $value = $value.Trim('"').Trim("'")

        if ($name.Length -gt 0) {
            Set-Item -Path "Env:$name" -Value $value
        }
    }
}

mvn spring-boot:run
