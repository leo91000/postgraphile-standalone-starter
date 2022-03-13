# @anais-coletta-coaching/api

Le backend de l'activité d'anais

## Configuration

### Required command line tools

- pg_dump
- pnpm
- just

### Env

```dotenv
# Base de données avec tous les droits
DATABASE_URL=
# Base deonnées avec des droits restreints
AUTH_DATABASE_URL=
# Session secret
SECRET=
# CORS origin
ALLOWED_ORIGINS=
# (Optionel) Utilise REDIS pour les session au lieu de postgres
REDIS_URL=
```