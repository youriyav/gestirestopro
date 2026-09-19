# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular 20 admin dashboard frontend for "Fitness" (internal project name `fitness` in `package.json`/`angular.json`; repo is named ZOYA). Standalone components (no NgModules), Tailwind CSS v4, signal-based state.

## Commands

```bash
npm start                              # ng serve, dev config, http://localhost:4200
ng serve --configuration=production    # serve against production environment file

npm run build                          # production build (default configuration)
ng build --configuration=development   # development build

npm test                               # karma/jasmine unit tests (watches by default)
ng test --no-watch --code-coverage     # single run with coverage

ng generate component path/to/name --standalone  # scaffold a standalone component
```

There is no lint script configured in `package.json`.

To run a single spec file, there's no CLI filter flag exposed via `ng test` directly — use Karma's `--include` or temporarily focus with `fdescribe`/`fit` in the spec.

## Architecture

### Path aliases
TypeScript path aliases are defined in `tsconfig.json` and used throughout:
- `@app/*` → `src/app/*`
- `@layout/*` → `src/app/layout/*`
- `@component/*` → `src/app/components/*`
- `@features/*` → `src/app/features/*`

Note there is no `@shared/*` or `@core/*` alias — code under `src/app/shared` and `src/app/core` is imported via `@app/shared/...` / `@app/core/...`, or with relative paths.

### Directory layout (`src/app`)
- `core/` — app-wide singletons: `services/` (AuthService, UsersService, sidebar, notification), `guards/` (`authGuard`), `interceptors/` (`authInterceptor`). These are cross-cutting and not feature-specific.
- `features/` — routed, page-level feature modules, one subfolder per feature (`auth/login`, `auth/forget-password`, `dashboard/home`). Loaded lazily via `loadComponent` in `app.routes.ts`.
- `layout/` — the authenticated app shell: `admin/` (the layout component routed at `''` with `authGuard`, contains `<router-outlet>`), `header/`, `sidebar/`.
- `components/` — reusable presentational UI: `ui/buttons`, `ui/icons` (one component per SVG icon), `ui/toast`, `ui/delete-confirmation-modal`, `card/`.
- `shared/` — cross-cutting non-Angular-DI code: `types/` (`ApiResponse<T>`, `HttpStatus`, `ErrorCode`, domain types), `enums/` (e.g. `USER_ROLES`), `helpers/`, `services/` (`ToastService`).

Every component is standalone: `@Component({ selector, imports: [...], templateUrl, styleUrl })`, no `@NgModule` declarations. Each component's imports array lists its own template dependencies directly.

### Auth flow
`AuthService` (`core/services/auth.service.ts`) is the single source of truth for auth state, exposed as readonly signals (`currentUser`, `isAuthenticated`, `isLoading`). Tokens (`access_token`, `refresh_token`) and the user object are persisted to `localStorage` and rehydrated on service construction (`loadUserFromStorage`).

- `authGuard` (functional `CanActivateFn`) checks `authService.isLoggedIn()` and redirects to `/login` with a `returnUrl` query param if not authenticated. Applied to the root layout route in `app.routes.ts`.
- `authInterceptor` (functional `HttpInterceptorFn`, registered via `provideHttpClient(withInterceptors([authInterceptor]))` in `app.config.ts`) attaches `Authorization: Bearer <token>` to outgoing requests (skipping `/auth/login` and `/auth/refresh`), and on a 401 transparently calls `authService.refreshToken()` and retries the original request once; if refresh fails it calls `authService.logout()`.
- All API responses are expected to be wrapped in `ApiResponse<T>` (`shared/types/api.types.ts`): `{ success, data?, error?, meta? }`.

### Routing
Defined in `src/app/app.routes.ts`. `/login` is a standalone lazy route. Everything else is nested under the root path (`''`), which renders `AdminComponentLayout` behind `authGuard`; feature pages are lazy-loaded children of that layout (e.g. `dashboard`). Redirects from `''` to `'dashboard'` inside the guarded tree.

### Environment configuration
`environment.apiUrl` (from `src/environments/environment.ts` / `environment.development.ts`, swapped via `angular.json` `fileReplacements`) is the actual source of the backend base URL used at runtime — services build endpoint URLs as `` `${environment.apiUrl}/<resource>` ``. **`.env` / `.env.example` are not wired into the Angular build and are not read at runtime** — don't assume changing `.env` affects the app; edit the `src/environments/*.ts` files instead.

### Styling
Tailwind CSS v4 via `@tailwindcss/postcss` (`.postcssrc.json`) and `@tailwindcss/cli`. Global theme tokens (custom color palette: `--color-bg-primary`, `--color-primary`, `--color-secondary`, `--color-accent`, `--color-success/warning/error`, etc.) are defined with `@theme` in `src/styles.css`. Components use Tailwind utility classes in templates plus a scoped per-component `.css` file (mostly empty/minimal, one exists per component by Angular CLI convention).

### Docker
Multi-stage `Dockerfile`: Node builder runs `npm run build -- --configuration=production`, output copied from `dist/fitness/browser` into an `nginx:alpine` stage configured via `docker/nginx/default.conf`, running as a non-root `nginx-app` user on port 80.
