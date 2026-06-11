#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (!fs.existsSync(distPath)) {
  console.log('dist directory not found, skipping post-build');
  process.exit(0);
}

// Copiar la carpeta public al dist (fonts)
const fontsSourceDir = path.join(publicPath, 'fonts');
const fontsDestDir = path.join(distPath, 'fonts');

if (fs.existsSync(fontsSourceDir)) {
  if (!fs.existsSync(fontsDestDir)) {
    fs.mkdirSync(fontsDestDir, { recursive: true });
  }

  fs.readdirSync(fontsSourceDir).forEach((file) => {
    fs.copyFileSync(
      path.join(fontsSourceDir, file),
      path.join(fontsDestDir, file)
    );
  });

  console.log('✓ Fonts copied to dist/fonts');
}
