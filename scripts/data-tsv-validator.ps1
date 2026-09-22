[CmdletBinding()]
param(
    [string]$Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$AllowedCategories = @(
    'Béke keresése',
    'Büszkeség',
    'Bűntudat',
    'Csapongó elme',
    'Demotiváció',
    'Düh',
    'Elengedés',
    'Elhagyatottság',
    'Félelem',
    'Halál',
    'Idő',
    'Irigység',
    'Kapzsiság',
    'Magányosság',
    'Megbocsátás',
    'Reménytelenség',
    'Vágy',
    'Változás',
    'Zavarodottság'
)

function Resolve-DataFilePath {
    param(
        [string]$InputPath
    )

    if ($InputPath) {
        return (Resolve-Path -LiteralPath $InputPath).Path
    }

    $candidatePaths = @(
        (Join-Path $PSScriptRoot 'data.tsv'),
        (Join-Path $PSScriptRoot '..\src\assets\data\data.tsv')
    )

    foreach ($candidatePath in $candidatePaths) {
        if (Test-Path -LiteralPath $candidatePath) {
            return (Resolve-Path -LiteralPath $candidatePath).Path
        }
    }

    throw "Nem található a validálandó data.tsv fájl. Add meg a -Path paraméterrel, vagy helyezd a script mellé."
}

function Add-ValidationError {
    param(
        [System.Collections.Generic.List[object]]$Collection,
        [int]$LineNumber,
        [string]$Message
    )

    $Collection.Add([pscustomobject]@{
            Line    = $LineNumber
            Message = $Message
        })
}

function Test-CategoryField {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $false
    }

    $categories = @($Value.Split(',') | ForEach-Object { $_.Trim() })

    if ($categories.Count -eq 0) {
        return $false
    }

    foreach ($category in $categories) {
        if ([string]::IsNullOrWhiteSpace($category) -or $AllowedCategories -notcontains $category) {
            return $false
        }
    }

    return $true
}

function Get-ContentFieldErrors {
    param(
        [string]$Value
    )

    $messages = New-Object System.Collections.Generic.List[string]
    $starPositions = New-Object System.Collections.Generic.List[int]

    for ($index = 0; $index -lt $Value.Length; $index++) {
        if ($Value[$index] -eq '*') {
            $starPositions.Add($index)
        }
    }

    if ($starPositions.Count % 2 -ne 0) {
        $messages.Add('A szövegben páratlan számú * szerepel, hiányzik egy nyitó vagy záró csillag.')
    }

    for ($index = 0; $index + 1 -lt $starPositions.Count; $index += 2) {
        $start = $starPositions[$index]
        $end = $starPositions[$index + 1]
        $highlighted = $Value.Substring($start + 1, $end - $start - 1)

        if ($highlighted -notmatch '^[\p{L}-]+$') {
            $messages.Add("Érvénytelen csillagok közötti szöveg: *$highlighted*. Csak betűk és kötőjel lehetnek benne.")
        }
    }

    return $messages
}

$dataFilePath = Resolve-DataFilePath -InputPath $Path
$fileContent = Get-Content -LiteralPath $dataFilePath -Raw -Encoding UTF8
$normalizedContent = ($fileContent -replace '^\uFEFF', '') -replace "`r`n?", "`n"
$lines = [System.Text.RegularExpressions.Regex]::Split($normalizedContent, "`n")
$errors = New-Object System.Collections.Generic.List[object]
$seenRecord = $false

for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    $lineNumber = $lineIndex + 1
    $line = $lines[$lineIndex]

    if ([string]::IsNullOrWhiteSpace($line)) {
        continue
    }

    $columns = $line.Split("`t")
    $firstColumn = if ($columns.Count -gt 0) { $columns[0].Trim() } else { '' }
    $looksLikeRecordLine = $line.Contains("`t") -or $firstColumn -match '^\d+$'
    $hasAtLeastFourColumns = $columns.Count -ge 4

    if (-not $hasAtLeastFourColumns) {
        if (-not $seenRecord) {
            Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A sor nem érvényes rekordkezdet.'
            continue
        }

        if ($looksLikeRecordLine) {
            Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A rekordsornak legalább 4 tabulátorral elválasztott oszlopot kell tartalmaznia.'
        }

        continue
    }

    $seenRecord = $true

    $chapterValue = $columns[0].Trim()
    $indexValue = $columns[1].Trim()
    $categoryValue = $columns[2].Trim()
    $textValue = $columns[3].Trim()

    if ($chapterValue -notmatch '^\d+$') {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'Az első oszlopnak egyetlen számnak kell lennie.'
    }

    if ($indexValue -notmatch '^\d+$|^\d+-\d+$') {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A második oszlopnak egy számnak vagy X-Y formátumnak kell lennie.'
    }

    if (-not (Test-CategoryField -Value $categoryValue)) {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message ("A harmadik oszlop csak a következő kategóriákat tartalmazhatja vesszővel elválasztva: {0}." -f ($AllowedCategories -join ', '))
    }

    foreach ($message in (Get-ContentFieldErrors -Value $textValue)) {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message $message
    }
}

Write-Output ("Validált fájl: {0}" -f $dataFilePath)

if ($errors.Count -eq 0) {
    Write-Output 'Nem találtam hibát.'
    exit 0
}

Write-Output ''
Write-Output 'Talált hibák:'
foreach ($errorItem in $errors) {
    Write-Output ("{0}. sor: {1}" -f $errorItem.Line, $errorItem.Message)
}

exit 1



