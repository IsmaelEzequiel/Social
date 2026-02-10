# social Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-10

## Active Technologies

- Elixir 1.17+ / OTP 27 (backend), TypeScript 5.x (mobile) + Phoenix 1.7, Ecto 3.11, Guardian 2.3, Oban 2.18, geo_postgis 3.6, stripity_stripe 3.2 (backend); React Native 0.81, Expo SDK 54, React Navigation v7, react-native-maps, Phoenix JS 1.7, RN Reanimated v4, MMKV v3, Apisauce v3 (mobile) (001-impulse-core-platform)

## Project Structure

```text
apps/
├── api/                    # Elixir/Phoenix backend
│   ├── lib/impulse/        # Business logic contexts
│   ├── lib/impulse_web/    # Controllers, channels, plugs
│   ├── priv/repo/migrations/
│   ├── test/
│   └── config/
└── mobile/                 # React Native (Ignite)
    ├── app/screens/
    ├── app/components/
    ├── app/models/
    ├── app/services/
    └── app/navigators/
packages/shared/            # Shared types, presets, constants
infra/                      # Docker, CI/CD
```

## Commands

```bash
# Backend
cd apps/api && mix test && mix format --check-formatted
# Mobile
cd apps/mobile && npm run lint && npx tsc --noEmit
# Local services
docker compose -f infra/docker-compose.yml up -d
```

## Code Style

- Elixir: Follow Phoenix conventions, contexts for business logic, `mix format`
- TypeScript: Ignite conventions, MobX-State-Tree for models, strict mode

## Recent Changes

- 001-impulse-core-platform: Added Elixir 1.17+ / OTP 27 (backend), TypeScript 5.x (mobile) + Phoenix 1.7, Ecto 3.11, Guardian 2.3, Oban 2.18, geo_postgis 3.6, stripity_stripe 3.2 (backend); React Native 0.81, Expo SDK 54, React Navigation v7, react-native-maps, Phoenix JS 1.7, RN Reanimated v4, MMKV v3, Apisauce v3 (mobile)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
