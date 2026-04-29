$errors = $null
$tokens = $null
[System.Management.Automation.Language.Parser]::ParseFile('build-apk.ps1',[ref]$tokens,[ref]$errors) > $null
if ($errors) {
    $errors | ForEach-Object {
        Write-Host ("ERR: {0} at line {1}, col {2}" -f $_.Message, $_.Extent.StartLineNumber, $_.Extent.StartColumn)
    }
    exit 1
}
else {
    Write-Host 'PARSE_OK'
    exit 0
}
