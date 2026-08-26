---
name: context-mode
description: Modos de gestión de contexto para optimizar conversaciones y memoria
type: configuration
tags:
  - context
  - memory
  - optimization
---

# Context Mode 🧠

Herramienta para gestionar el contexto de conversación, memoria y estado de ejecución.

## Modos Disponibles

### 1. Deep Context
Máxima profundidad de análisis, retiene todo contexto histórico.

```bash
/context-mode deep
```

**Características:**
- Recuerda todo el historial
- Análisis profundo de contexto
- Recomendaciones basadas en historia completa
- Mejor para proyectos largos

### 2. Focus Context
Contexto limitado al trabajo actual, optimizado para eficiencia.

```bash
/context-mode focus
```

**Características:**
- Solo contexto relevante actual
- Menor overhead de tokens
- Enfoque en la tarea presente
- Mejor para tareas cortas

### 3. Hybrid Context
Combina contexto reciente con historia seleccionada.

```bash
/context-mode hybrid
```

**Características:**
- Balance entre profundidad y eficiencia
- Retiene puntos clave históricos
- Adapta automáticamente según necesidad
- Recomendado por defecto

### 4. Project Context
Contexto enfocado en un proyecto específico.

```bash
/context-mode project nombre-proyecto
```

**Características:**
- Carga datos del proyecto automáticamente
- Mantiene memoria del proyecto
- Integra CLAUDE.md y configuración
- Ideal para trabajo persistente

## Configuración

### Token Budget
```bash
/context-mode --tokens 50000
```

### Memory Strategy
```bash
/context-mode --memory aggressive|balanced|conservative
```

### Auto-Summarization
```bash
/context-mode --auto-summarize true
--summarize-after 20000-tokens
```

## Casos de Uso

| Caso | Modo Recomendado |
|------|------------------|
| Refactor largo | Deep Context |
| Bugfix rápido | Focus Context |
| Feature normal | Hybrid Context |
| Proyecto multi-sesión | Project Context |

## Memory Snapshot

Guarda estado actual del contexto:

```bash
/context-mode snapshot save nombre-estado
/context-mode snapshot load nombre-estado
```

## Visualización

Ver estado actual del contexto:

```bash
/context-mode info
```

Muestra:
- Tokens usados
- Modo activo
- Memoria disponible
- Puntos de resumen

## Limpieza

### Limpiar contexto obsoleto
```bash
/context-mode cleanup
```

### Reset a estado inicial
```bash
/context-mode reset
```

## Integración

Combina con otros skills:
- `/skill-creator` - Crear skills en contexto profundo
- `/gsd` - Ejecutar tareas en contexto enfocado
- `/review` - Reviews en contexto del proyecto

## Mejor Práctica

Para sesiones largas:
1. Iniciar en `hybrid` mode
2. Cambiar a `focus` para tareas específicas
3. Usar snapshots para cambios de dirección
4. Guardar estado con `/context-mode snapshot save`

## Vea También

- `/claude-men` - Mentoría con contexto
- `/gsd` - Ejecución con contexto optimizado
