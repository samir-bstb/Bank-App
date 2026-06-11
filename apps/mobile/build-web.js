#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

const fontsDestination = path.join(__dirname, 'public/fonts');

// Crear directorio si no existe
if (!fs.existsSync(fontsDestination)) {
  fs.mkdirSync(fontsDestination, { recursive: true });
}

// Buscar la carpeta de @expo/vector-icons
const nodeModulesPath = path.join(__dirname, 'node_modules/.pnpm');
if (fs.existsSync(nodeModulesPath)) {
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
    } else {
      console.warn('⚠ Fonts source directory not found');
    }
  }
}

// Ejecutar el build (usando expo start para web)
console.log('Building Expo project...');
try {
  execSync('expo export --platform web', {
    cwd: __dirname,
    stdio: 'inherit',
  });

  // Copiar las fuentes nuevamente a la carpeta dist si existe
  if (fs.existsSync(path.join(__dirname, 'dist'))) {
    const distFontsDir = path.join(__dirname, 'dist', 'fonts');
    if (!fs.existsSync(distFontsDir)) {
      fs.mkdirSync(distFontsDir, { recursive: true });
    }
    fs.readdirSync(fontsDestination).forEach((font) => {
      fs.copyFileSync(
        path.join(fontsDestination, font),
        path.join(distFontsDir, font)
      );
    });
    console.log('✓ Fonts copied to dist/fonts');
  }

  console.log('✓ Expo export completed');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
