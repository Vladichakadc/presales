---
name: code-review-guide
description: Guía completa de /review y /ultrareview - comandos de code review en Claude
type: guide
tags:
  - code-review
  - quality
  - validation
  - testing
---

# Code Review Guide - /review y /ultrareview 🔍

Guía completa para usar los comandos de code review nativos de Claude Code.

## /review - Code Review Local

Análisis rápido de cambios en el branch actual.

### Uso Básico

```bash
/review
```

Analiza automáticamente:
- Cambios no commiteados
- Archivos modificados
- Commits nuevos

### Con Opciones

```bash
/review
  --branch main
  --since "2 days ago"
  --fix true
  --severity critical
```

### Qué Revisa

✅ **Correctitud**
- Errores lógicos
- Edge cases
- Null checks

✅ **Calidad**
- Estándares de código
- Duplicación
- Complejidad

✅ **Seguridad**
- Vulnerabilidades comunes
- Inyecciones
- Manejo de secretos

✅ **Performance**
- Bucles ineficientes
- Memory leaks
- Llamadas redundantes

✅ **Testing**
- Cobertura de tests
- Edge cases no cubiertos
- Mocks adecuados

### Salida

```
📝 REVIEW RESULTS
├─ ✅ 5 items passed
├─ ⚠️  2 warnings
├─ 🔴 1 error encontrado
└─ 📊 Código quality score: 92/100
```

---

## /ultrareview - Multi-Agent Cloud Review

Review profesional multi-agente en la nube. **Más potente y exhaustivo.**

### Requisitos

- Repositorio Git (con `git init` si es necesario)
- Branch con commits

### Uso Básico

```bash
/ultrareview
```

### Con Opciones

```bash
/ultrareview
  --branch main
  --compare main...feature-branch
  --deep true
  --report pdf
```

### Agentes Involucrados

🤖 **Architecture Agent**
- Decisiones de diseño
- Patrones utilizados
- Escalabilidad

🤖 **Security Agent**
- Vulnerabilidades
- Secrets exposure
- OWASP compliance

🤖 **Performance Agent**
- Optimizaciones
- Memory management
- N+1 queries

🤖 **Testing Agent**
- Cobertura de tests
- Test quality
- Mutation testing

🤖 **Code Quality Agent**
- Estándares
- Legibilidad
- Mantenibilidad

### Flujo de Ejecución

1. **Analysis** - Cada agente analiza el código (5-10 min)
2. **Cross-Check** - Los agentes se validan entre sí (2-3 min)
3. **Report Generation** - Compilación de resultados (1-2 min)
4. **Recommendations** - Sugerencias prioritizadas (auto)

### Salida

```
📊 ULTRAREVIEW REPORT
├─ Architecture    ⭐⭐⭐⭐⭐
├─ Security        ⭐⭐⭐⭐
├─ Performance     ⭐⭐⭐⭐⭐
├─ Testing         ⭐⭐⭐⭐
└─ Code Quality    ⭐⭐⭐⭐⭐

🔍 FINDINGS
├─ 12 Critical issues
├─ 8 High priority
├─ 15 Medium priority
└─ 20 Low priority

💡 KEY RECOMMENDATIONS
1. Refactor auth middleware...
2. Add rate limiting...
3. Improve error handling...
```

---

## Comparación: /review vs /ultrareview

| Aspecto | /review | /ultrareview |
|---------|---------|--------------|
| Velocidad | ⚡ Rápido (< 1 min) | ⏳ Lento (15-20 min) |
| Profundidad | 📊 Buena | 📊📊 Excelente |
| Costo | 💰 Gratis | 💰💰 Pago |
| Agentes | 1 | 5+ |
| Formato | Terminal | HTML/PDF |
| Localidad | Local | Cloud |
| Uso | Desarrollo | Pre-PR |

---

## Casos de Uso

### Usar /review

```bash
# Durante desarrollo
/review

# Validar cambios rápidamente
/review --quick

# Revisar solo un archivo
/review --files src/app.jsx

# Buscar problemas específicos
/review --severity critical
```

### Usar /ultrareview

```bash
# Antes de hacer PR
/ultrareview

# Review completo con report
/ultrareview --report pdf

# Comparar branches
/ultrareview --compare main...feature

# Deep analysis
/ultrareview --deep true --strict true
```

---

## Flujos de Trabajo Recomendados

### Workflow 1: Development

```bash
# 1. Escribir código
# ... (desarrollo)

# 2. Review rápido
/review

# 3. Corregir issues
# ... (fixes)

# 4. Commit
git commit -m "feat: nueva funcionalidad"
```

### Workflow 2: Pre-PR

```bash
# 1. Completa la feature
# ... (desarrollo)

# 2. Review local
/review

# 3. Arregla issues encontrados
# ... (fixes)

# 4. Ultra review antes de PR
/ultrareview

# 5. Arregla issues críticos
# ... (fixes)

# 6. Push y create PR
git push origin feature
# Crear PR en GitHub
```

### Workflow 3: Code Quality

```bash
# 1. Cada mañana
/review --branch develop

# 2. Antes de release
/ultrareview --branch develop

# 3. Documentar findings
# ... (actualizar docs)
```

---

## Tips y Tricks

### 1. Ignorar Archivos

```bash
# Crear .reviewignore
/dist
/build
*.min.js
node_modules/
```

### 2. Configuración Persistente

```bash
# .claude.yml
review:
  strict: true
  severity: high
  ignore:
    - tests/**
```

### 3. Auto-Fix

```bash
/review --fix true
```

Intenta arreglar automáticamente issues detectadas.

### 4. Report Exportable

```bash
/ultrareview --format json --output review.json
/ultrareview --format html --output review.html
```

---

## Integrando con CI/CD

### GitHub Actions

```yaml
- name: Code Review
  run: /review --strict

- name: Ultra Review
  if: github.event_name == 'pull_request'
  run: /ultrareview
```

### Pre-commit Hook

```bash
#!/bin/bash
/review
if [ $? -ne 0 ]; then
  echo "Review failed, commit cancelled"
  exit 1
fi
```

---

## Combinando con Otros Skills

```bash
# 1. Planificar feature
/feature-planning --feature "auth-refactor"

# 2. Implementar
# ... (código)

# 3. Review rápido
/review

# 4. GSD workflow
/gsd --task "refactor completado"

# 5. Ultra review antes de PR
/ultrareview

# 6. Mentoría en findings
/claude-men --topic "architectural-patterns"
```

---

## FAQ

**¿Cuándo usar /review?**
→ Durante desarrollo, validaciones rápidas

**¿Cuándo usar /ultrareview?**
→ Antes de PR, releases, auditorías de código

**¿Puedo usar ultrareview sin GitHub?**
→ Sí, con `git init` en carpeta local

**¿Cuánto cuesta ultrareview?**
→ Facturable según tokens usados

**¿Qué pasa con secrets en el reporte?**
→ Son detectados y NO se incluyen en salida

---

## Vea También

- `/skill-creator` - Crear custom review skills
- `/gsd` - Ejecutar fixes de review
- `/claude-men` - Aprender de findings
