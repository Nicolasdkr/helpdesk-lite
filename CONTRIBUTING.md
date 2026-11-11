# Guía de contribución / Contributing guide

## Ramas / Branches

- `main`: siempre estable y desplegable / always stable.
- `feat/<nombre>`: nuevas funcionalidades / new features (ej. `feat/auth-jwt`).
- `fix/<nombre>`: corrección de errores / bug fixes.

Flujo: crea una rama → commits pequeños → Pull Request → merge a `main`.

## Commits — Conventional Commits

Formato / Format:

```
<tipo>(<ámbito opcional>): <descripción en imperativo>
```

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `docs` | Solo documentación |
| `refactor` | Cambio de código sin alterar comportamiento |
| `test` | Añadir o corregir tests |
| `chore` | Configuración, dependencias, tareas de mantenimiento |
| `ci` | Cambios en GitHub Actions |

Ejemplos / Examples:

```
feat(tickets): add filter by priority
fix(auth): return 401 when token is expired
docs: add API endpoints table to README
chore(backend): set up Prisma with PostgreSQL
```

Buenas prácticas / Good practices:

- Un commit = un cambio lógico. / One commit = one logical change.
- Mensajes en inglés y en imperativo (`add`, no `added`). / English, imperative mood.
- Nunca subas `.env` ni credenciales. / Never commit `.env` or secrets.
- Antes de cada commit / Before committing: `npm run typecheck && npm test`.
