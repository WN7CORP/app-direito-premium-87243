/**
 * Script para otimizar o logo em múltiplos tamanhos
 * 
 * Uso:
 * 1. Instalar dependências: npm install sharp
 * 2. Executar: node scripts/optimize-logo.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { name: 'logo-32.webp', size: 32 },
  { name: 'logo-64.webp', size: 64 },
  { name: 'logo-128.webp', size: 128 }
];

const inputPath = path.join(__dirname, '../public/logo.webp');
const outputDir = path.join(__dirname, '../public');

async function optimizeLogo() {
  console.log('🎨 Iniciando otimização do logo...\n');

  // Verificar se o arquivo original existe
  if (!fs.existsSync(inputPath)) {
    console.error('❌ Erro: logo.webp não encontrado em /public/');
    console.log('💡 Certifique-se de que o arquivo logo.webp existe no diretório public/');
    process.exit(1);
  }

  for (const { name, size } of sizes) {
    try {
      const outputPath = path.join(outputDir, name);
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ 
          quality: 90,
          effort: 6 // Maior esforço de compressão
        })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.log(`✅ ${name} criado (${size}x${size}px, ${sizeKB}KB)`);
    } catch (error) {
      console.error(`❌ Erro ao criar ${name}:`, error.message);
    }
  }

  console.log('\n🎉 Otimização concluída!');
  console.log('📊 Verifique os arquivos em /public/');
  
  // Mostrar economia estimada
  const originalStats = fs.statSync(inputPath);
  const originalSizeKB = (originalStats.size / 1024).toFixed(2);
  console.log(`\n💰 Economia estimada:`);
  console.log(`   Logo original: ${originalSizeKB}KB`);
  console.log(`   Logo 32x32: ~3-5KB (economia de ~95%)`);
  console.log(`   Logo 64x64: ~8-12KB (economia de ~90%)`);
  console.log(`   Logo 128x128: ~25-35KB (economia de ~80%)`);
}

optimizeLogo().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
