# Scripts de Otimização

## optimize-logo.js

Script automatizado para criar versões otimizadas do logo em diferentes tamanhos.

### Instalação

```bash
npm install sharp
```

### Uso

```bash
node scripts/optimize-logo.js
```

### O que faz:

1. Lê o arquivo `/public/logo.webp`
2. Cria 3 versões otimizadas:
   - `logo-32.webp` (32x32px) - para mobile/desktop
   - `logo-64.webp` (64x64px) - para telas HD
   - `logo-128.webp` (128x128px) - para telas Retina
3. Aplica compressão WebP otimizada (qualidade 90%)
4. Mostra estatísticas de economia

### Economia Esperada:

- Logo original: ~189KB
- Logo 32x32: ~3-5KB (**95% de economia**)
- Logo 64x64: ~8-12KB (**90% de economia**)
- Logo 128x128: ~25-35KB (**80% de economia**)

### Resultado:

O navegador carregará automaticamente a versão mais apropriada baseado no tamanho da tela, melhorando significativamente a performance do Lighthouse.
