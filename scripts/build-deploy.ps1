#!/usr/bin/env pwsh
# Build deploy script - copies dist/browser contents to docs folder

$docsPath = "docs"
$distPath = "dist/browser"

# Remove docs directory if it exists
if (Test-Path $docsPath) {
    Write-Host "Deleting $docsPath directory..."
    Remove-Item -Path $docsPath -Recurse -Force
}

# Create docs directory
Write-Host "Creating $docsPath directory..."
New-Item -ItemType Directory -Path $docsPath -Force | Out-Null

# Copy dist/browser contents to docs
if (Test-Path $distPath) {
    Write-Host "Copying $distPath contents to $docsPath..."
    Copy-Item -Path "$distPath/*" -Destination $docsPath -Recurse -Force
    Write-Host "Build deploy completed successfully!"
} else {
    Write-Error "Error: $distPath does not exist. Make sure you ran 'npm run build' first."
    exit 1
}

