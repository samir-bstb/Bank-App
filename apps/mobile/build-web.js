#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const fontsDestination = path.join(__dirname, 'public/fonts');

// Crear directorio si no existe
if (!fs.existsSync(fontsDestination)) {
  fs.mkdirSync(fontsDestination, { recursive: true });
}

// Buscar y copiar las fuentes de @expo/vector-icons
const nodeModulesPath = path.join(__dirname, 'node_modules/.pnpm');
if (fs.existsSync(nodeModulesPath)) {
  try {
    const pnpmDirs = fs.readdirSync(nodeModulesPath);
    const vectorIconsDir = pnpmDirs.find((dir) =>
      dir.startsWith('@expo+vector-icons')
    );

    if (vectorIconsDir) {
      const fontsSource = path.join(
        nodeModulesPath,
        vectorIconsDir,
        'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts'
      );

      if (fs.existsSync(fontsSource)) {
        const fonts = fs.readdirSync(fontsSource);
        fonts.forEach((font) => {
          const src = path.join(fontsSource, font);
          const dest = path.join(fontsDestination, font);
          fs.copyFileSync(src, dest);
        });
        console.log(`✓ Fonts copied to public/fonts (${fonts.length} files)`);
      }
    }
  } catch (err) {
    console.warn('⚠ Could not copy fonts:', err.message);
  }
}

// Ejecutar expo export
console.log('Building Expo project...');
try {
  execSync('npx expo export --platform web', {
    cwd: __dirname,
    stdio: 'inherit',
  });
  console.log('✓ Expo export completed');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
