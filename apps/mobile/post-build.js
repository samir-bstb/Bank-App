#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (!fs.existsSync(distPath)) {
  console.log('⚠ dist directory not found, skipping post-build');
  process.exit(0);
}

// Copiar las fuentes de public a dist
const fontsSourceDir = path.join(publicPath, 'fonts');
const fontsDestDir = path.join(distPath, 'fonts');

try {
  if (fs.existsSync(fontsSourceDir)) {
    if (!fs.existsSync(fontsDestDir)) {
      fs.mkdirSync(fontsDestDir, { recursive: true });
    }

    const fonts = fs.readdirSync(fontsSourceDir);
    fonts.forEach((file) => {
      const src = path.join(fontsSourceDir, file);
      const dest = path.join(fontsDestDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dest);
      }
    });

    console.log(`✓ Fonts copied to dist/fonts (${fonts.length} files)`);
  } else {
    console.log('⚠ No fonts found in public/fonts');
  }
} catch (err) {
  console.error('✗ Post-build failed:', err.message);
  process.exit(1);
}
