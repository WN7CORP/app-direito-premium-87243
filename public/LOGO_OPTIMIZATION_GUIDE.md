# Logo Optimization Guide

## Versões Necessárias do Logo

Para otimizar o carregamento do logo, crie as seguintes versões em WebP:

### Tamanhos Requeridos:
- `logo-32.webp` - 32x32px (para desktop/tablets)
- `logo-64.webp` - 64x64px (para telas de alta resolução)
- `logo-128.webp` - 128x128px (para retina displays)

### Como Criar:

#### Opção 1: Usando Ferramentas Online
1. Acesse https://squoosh.app/
2. Faça upload do logo original
3. Redimensione para cada tamanho
4. Exporte como WebP com qualidade 85-90
5. Salve com os nomes corretos em `/public/`

#### Opção 2: Usando ImageMagick (linha de comando)
```bash
# Instalar ImageMagick
# No Ubuntu/Debian: sudo apt-get install imagemagick
# No Mac: brew install imagemagick

# Criar as versões
convert logo.webp -resize 32x32 logo-32.webp
convert logo.webp -resize 64x64 logo-64.webp
convert logo.webp -resize 128x128 logo-128.webp
```

#### Opção 3: Usando Sharp (Node.js)
```javascript
const sharp = require('sharp');

// Logo 32x32
sharp('logo.webp')
  .resize(32, 32)
  .webp({ quality: 90 })
  .toFile('logo-32.webp');

// Logo 64x64
sharp('logo.webp')
  .resize(64, 64)
  .webp({ quality: 90 })
  .toFile('logo-64.webp');

// Logo 128x128
sharp('logo.webp')
  .resize(128, 128)
  .webp({ quality: 90 })
  .toFile('logo-128.webp');
```

### Benefícios:
- ✅ Redução de 80-90% no tamanho do arquivo para mobile
- ✅ Carregamento mais rápido (de ~189KB para ~15KB em mobile)
- ✅ Melhor performance no Lighthouse
- ✅ Economia de largura de banda

### Implementação:
O código já está preparado em `src/components/Header.tsx` com srcset:
```tsx
<img 
  src="/logo.webp" 
  srcSet="/logo-32.webp 32w, /logo-64.webp 64w, /logo-128.webp 128w"
  sizes="(max-width: 768px) 40px, 32px"
  ...
/>
```

O navegador automaticamente escolherá a melhor versão baseado no tamanho da tela!
