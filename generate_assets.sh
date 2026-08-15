#!/bin/bash
set -e

echo "Generating PWA & Android assets from logo.jpg..."

mkdir -p public

# Web / PWA icons
convert logo.jpg -resize 32x32 public/favicon.ico
convert logo.jpg -resize 32x32 public/favicon.png
convert logo.jpg -resize 180x180 public/apple-touch-icon.png
convert logo.jpg -resize 192x192 public/icon-192.png
convert logo.jpg -resize 512x512 public/icon-512.png
convert logo.jpg -resize 512x512 public/logo.png
cp logo.jpg public/logo.jpg

# Maskable icon with 10% padding
convert logo.jpg -resize 410x410 -gravity center -background "#050816" -extent 512x512 public/maskable-icon-512.png

echo "Web assets generated in public/"

# Android mipmap launcher icons
RES_DIR="android/app/src/main/res"

if [ -d "$RES_DIR" ]; then
  # mdpi (48x48)
  convert logo.jpg -resize 48x48 $RES_DIR/mipmap-mdpi/ic_launcher.png
  convert logo.jpg -resize 48x48 $RES_DIR/mipmap-mdpi/ic_launcher_round.png
  convert logo.jpg -resize 48x48 $RES_DIR/mipmap-mdpi/ic_launcher_foreground.png

  # hdpi (72x72)
  convert logo.jpg -resize 72x72 $RES_DIR/mipmap-hdpi/ic_launcher.png
  convert logo.jpg -resize 72x72 $RES_DIR/mipmap-hdpi/ic_launcher_round.png
  convert logo.jpg -resize 72x72 $RES_DIR/mipmap-hdpi/ic_launcher_foreground.png

  # xhdpi (96x96)
  convert logo.jpg -resize 96x96 $RES_DIR/mipmap-xhdpi/ic_launcher.png
  convert logo.jpg -resize 96x96 $RES_DIR/mipmap-xhdpi/ic_launcher_round.png
  convert logo.jpg -resize 96x96 $RES_DIR/mipmap-xhdpi/ic_launcher_foreground.png

  # xxhdpi (144x144)
  convert logo.jpg -resize 144x144 $RES_DIR/mipmap-xxhdpi/ic_launcher.png
  convert logo.jpg -resize 144x144 $RES_DIR/mipmap-xxhdpi/ic_launcher_round.png
  convert logo.jpg -resize 144x144 $RES_DIR/mipmap-xxhdpi/ic_launcher_foreground.png

  # xxxhdpi (192x192)
  convert logo.jpg -resize 192x192 $RES_DIR/mipmap-xxxhdpi/ic_launcher.png
  convert logo.jpg -resize 192x192 $RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png
  convert logo.jpg -resize 192x192 $RES_DIR/mipmap-xxxhdpi/ic_launcher_foreground.png

  # Main splash image
  convert logo.jpg -resize 512x512 -gravity center -background "#050816" -extent 512x512 $RES_DIR/drawable/splash.png

  # Portrait Splash Screens
  convert logo.jpg -resize 200x200 -gravity center -background "#050816" -extent 320x480 $RES_DIR/drawable-port-mdpi/splash.png
  convert logo.jpg -resize 300x300 -gravity center -background "#050816" -extent 480x800 $RES_DIR/drawable-port-hdpi/splash.png
  convert logo.jpg -resize 450x450 -gravity center -background "#050816" -extent 720x1280 $RES_DIR/drawable-port-xhdpi/splash.png
  convert logo.jpg -resize 600x600 -gravity center -background "#050816" -extent 960x1600 $RES_DIR/drawable-port-xxhdpi/splash.png
  convert logo.jpg -resize 800x800 -gravity center -background "#050816" -extent 1280x1920 $RES_DIR/drawable-port-xxxhdpi/splash.png

  # Landscape Splash Screens
  convert logo.jpg -resize 200x200 -gravity center -background "#050816" -extent 480x320 $RES_DIR/drawable-land-mdpi/splash.png
  convert logo.jpg -resize 300x300 -gravity center -background "#050816" -extent 800x480 $RES_DIR/drawable-land-hdpi/splash.png
  convert logo.jpg -resize 450x450 -gravity center -background "#050816" -extent 1280x720 $RES_DIR/drawable-land-xhdpi/splash.png
  convert logo.jpg -resize 600x600 -gravity center -background "#050816" -extent 1600x960 $RES_DIR/drawable-land-xxhdpi/splash.png
  convert logo.jpg -resize 800x800 -gravity center -background "#050816" -extent 1920x1280 $RES_DIR/drawable-land-xxxhdpi/splash.png

  echo "Android mipmap & drawable assets updated!"
fi

