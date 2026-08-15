#!/bin/bash
set -e

echo "Generating specific PWA icons from logo.jpg..."

mkdir -p public

# Convert logo.jpg into exact requested icons in public/
convert logo.jpg -resize 16x16 public/favicon-16x16.png
convert logo.jpg -resize 32x32 public/favicon-32x32.png
convert logo.jpg -resize 32x32 public/favicon.ico
convert logo.jpg -resize 180x180 public/apple-touch-icon.png
convert logo.jpg -resize 192x192 public/pwa-192x192.png
convert logo.jpg -resize 512x512 public/pwa-512x512.png

# Maskable icons with appropriate safe padding
convert logo.jpg -resize 154x154 -gravity center -background "#050816" -extent 192x192 public/maskable-192x192.png
convert logo.jpg -resize 410x410 -gravity center -background "#050816" -extent 512x512 public/maskable-512x512.png

# Also maintain icon-192.png and icon-512.png for backwards compatibility
cp public/pwa-192x192.png public/icon-192.png
cp public/pwa-512x512.png public/icon-512.png

echo "PWA icons successfully generated!"
ls -la public/
