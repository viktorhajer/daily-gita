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

$OptionsWordPattern = "[\p{L}][\p{L}\p{M}'’-]*"
$OptionsFieldPattern = "^\[(?:\s*\[\s*$OptionsWordPattern(?:\s*,\s*$OptionsWordPattern)*\s*\]\s*(?:,\s*\[\s*$OptionsWordPattern(?:\s*,\s*$OptionsWordPattern)*\s*\]\s*)*)\]$"

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

function Get-HighlightedWordCount {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrEmpty($Value)) {
        return 0
    }

    $starCount = 0

    for ($index = 0; $index -lt $Value.Length; $index++) {
        if ($Value[$index] -eq '*') {
            $starCount++
        }
    }

    return [math]::Floor($starCount / 2)
}

function Test-OptionsField {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $true
    }

    return [System.Text.RegularExpressions.Regex]::IsMatch($Value.Trim(), $OptionsFieldPattern)
}

function Get-OptionsGroupCount {
    param(
        [string]$Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0
    }

    return [System.Text.RegularExpressions.Regex]::Matches($Value.Trim(), "\[\s*$OptionsWordPattern(?:\s*,\s*$OptionsWordPattern)*\s*\]").Count
}

function Test-HighlightedWordOptionsCount {
    param(
        [int]$ExpectedCount,
        [string]$OptionsValue
    )

    if ([string]::IsNullOrWhiteSpace($OptionsValue) -or -not (Test-OptionsField -Value $OptionsValue)) {
        return $true
    }

    return $ExpectedCount -eq (Get-OptionsGroupCount -Value $OptionsValue)
}

function Get-LineTextAndOptions {
    param(
        [string[]]$Columns
    )

    $columnValues = @($Columns)
    $textColumns = @($columnValues)
    $optionsValue = ''

    if ($columnValues.Length -gt 0) {
        $lastColumn = $columnValues[$columnValues.Length - 1].Trim()

        if ([string]::IsNullOrWhiteSpace($lastColumn)) {
            $textColumns = if ($columnValues.Length -gt 1) { @($columnValues[0..($columnValues.Length - 2)]) } else { @('') }
        }
        elseif (Test-OptionsField -Value $lastColumn) {
            $optionsValue = $lastColumn
            $textColumns = if ($columnValues.Length -gt 1) { @($columnValues[0..($columnValues.Length - 2)]) } else { @('') }
        }
    }

    return [pscustomobject]@{
        Text    = ($textColumns -join "`t").Trim()
        Options = $optionsValue
    }
}

$dataFilePath = Resolve-DataFilePath -InputPath $Path
$fileContent = Get-Content -LiteralPath $dataFilePath -Raw -Encoding UTF8
$normalizedContent = ($fileContent -replace '^\uFEFF', '') -replace "`r`n?", "`n"
$lines = @([System.Text.RegularExpressions.Regex]::Split($normalizedContent, "`n"))
$errors = New-Object System.Collections.Generic.List[object]
$seenRecord = $false
$currentHighlightedWordCount = 0

for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    $lineNumber = $lineIndex + 1
    $line = $lines[$lineIndex]

    if ([string]::IsNullOrWhiteSpace($line)) {
        continue
    }

    $columns = @($line.Split("`t"))
    $firstColumn = if ($columns.Count -gt 0) { $columns[0].Trim() } else { '' }
    $isRecordStart =
        $columns.Count -ge 4 -and
        $firstColumn -match '^\d+$' -and
        -not [string]::IsNullOrWhiteSpace($columns[1])

    if (-not $seenRecord -and -not $isRecordStart) {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A sor nem érvényes rekordkezdet.'
        continue
    }

    if ($isRecordStart) {
        $seenRecord = $true

        $chapterValue = $columns[0].Trim()
        $indexValue = $columns[1].Trim()
        $categoryValue = $columns[2].Trim()
        $textValue = $columns[3].Trim()
        $currentHighlightedWordCount = Get-HighlightedWordCount -Value $textValue
        $tailFields = if ($columns.Count -gt 4) { @($columns[4..($columns.Count - 1)]) } else { @() }
        $linePayload = Get-LineTextAndOptions -Columns $tailFields

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

        if ($linePayload.Options -and -not (Test-HighlightedWordOptionsCount -ExpectedCount $currentHighlightedWordCount -OptionsValue $linePayload.Options)) {
            Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message ("Az options mezőben {0} altömb van, de a 4. oszlopban {1} csillagozott szó szerepel." -f (Get-OptionsGroupCount -Value $linePayload.Options), $currentHighlightedWordCount)
        }

        if (@($tailFields).Length -gt 0) {
            $tailFieldValues = @($tailFields)
            $rawOptionsValue = $tailFieldValues[$tailFieldValues.Length - 1].Trim()
            if (-not [string]::IsNullOrWhiteSpace($rawOptionsValue) -and -not (Test-OptionsField -Value $rawOptionsValue) -and $rawOptionsValue.StartsWith('[')) {
                Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'Az options mező formátuma hibás. Elvárt alak például: [[word], [word, word], [word, word, word]].'
            }
        }

        continue
    }

    $linePayload = Get-LineTextAndOptions -Columns $columns
    $rawOptionsValue = if ($columns.Count -gt 0) { $columns[$columns.Count - 1].Trim() } else { '' }

    if (-not $linePayload.Text -and -not $linePayload.Options) {
        if (-not $seenRecord) {
            Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A sor nem érvényes rekordkezdet.'
            continue
        }

        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'A folytatássornak szanszkrit szöveget vagy opcionálisan egy érvényes options mezőt kell tartalmaznia.'

        continue
    }

    if (-not [string]::IsNullOrWhiteSpace($rawOptionsValue) -and -not (Test-OptionsField -Value $rawOptionsValue) -and $rawOptionsValue.StartsWith('[')) {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message 'Az options mező formátuma hibás. Elvárt alak például: [[word], [word, word], [word, word, word]].'
    }

    if ($linePayload.Options -and -not (Test-HighlightedWordOptionsCount -ExpectedCount $currentHighlightedWordCount -OptionsValue $linePayload.Options)) {
        Add-ValidationError -Collection $errors -LineNumber $lineNumber -Message ("Az options mezőben {0} altömb van, de a 4. oszlopban {1} csillagozott szó szerepel." -f (Get-OptionsGroupCount -Value $linePayload.Options), $currentHighlightedWordCount)
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



