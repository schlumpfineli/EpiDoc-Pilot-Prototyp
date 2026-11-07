#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk/jdk-21.0.13+9/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -x "$JAVA_HOME/bin/java" ]; then
  echo "JDK 21 nicht gefunden unter $JAVA_HOME"
  exit 1
fi
if [ ! -d "$ANDROID_HOME/platforms/android-36" ]; then
  echo "Android SDK 36 nicht gefunden unter $ANDROID_HOME"
  exit 1
fi

echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"
cd "$ROOT"
npx cap sync android
cd "$ROOT/android"
./gradlew assembleDebug
echo
echo "APK: $ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
