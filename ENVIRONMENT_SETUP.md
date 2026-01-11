# Environment Configuration Guide

This guide explains how to configure environment-specific settings for the Fitness App.

## Environment Files

The application uses two environment files:

### 1. Development Environment
**File**: `src/environments/environment.development.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

Used when running:
- `ng serve` (default)
- `ng build --configuration=development`

### 2. Production Environment
**File**: `src/environments/environment.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com'
};
```

Used when running:
- `ng build` (default)
- `ng build --configuration=production`

## Configuration

### Angular.json File Replacements

The `angular.json` file is configured to automatically replace environment files based on the build configuration:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.ts"
      }
    ]
  },
  "development": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.development.ts"
      }
    ]
  }
}
```

## Usage in Code

Import the environment configuration in your services:

```typescript
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  // ... rest of the service
}
```

## Setting Up Your Environment

### For Development:

1. Update `src/environments/environment.development.ts`:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000'  // Your local backend URL
   };
   ```

2. Run the development server:
   ```bash
   ng serve
   ```

### For Production:

1. Update `src/environments/environment.ts`:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://your-api-domain.com'  // Your production API URL
   };
   ```

2. Build for production:
   ```bash
   ng build --configuration=production
   ```

## Available Environment Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `production` | boolean | Indicates if running in production mode | `true` or `false` |
| `apiUrl` | string | Base URL for the backend API | `http://localhost:3000` |

## Adding New Environment Variables

To add new environment variables:

1. Add the variable to both environment files:

   **environment.development.ts**:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000',
     newVariable: 'development-value'  // Add here
   };
   ```

   **environment.ts**:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://api.production.com',
     newVariable: 'production-value'  // Add here
   };
   ```

2. Use the variable in your code:
   ```typescript
   import { environment } from '../environments/environment';

   const myValue = environment.newVariable;
   ```

## Build Commands

### Development Build
```bash
ng build --configuration=development
```
Uses: `environment.development.ts`

### Production Build
```bash
ng build --configuration=production
# or simply
ng build
```
Uses: `environment.ts`

### Serve Development
```bash
ng serve
# or
ng serve --configuration=development
```

### Serve Production
```bash
ng serve --configuration=production
```

## Important Notes

1. **Never commit sensitive data** like API keys or passwords in environment files
2. The `environment.development.ts` file is used by default when running `ng serve`
3. The `environment.ts` file is used by default when running `ng build`
4. Environment files are included in version control - use them for non-sensitive configuration only
5. For sensitive data, consider using environment variables or secure configuration management

## Backend API Configuration

The backend API URL is configured in the environment files. Make sure your backend is running on the correct port:

- **Development**: `http://localhost:3000`
- **Production**: Update to your production API URL

## Troubleshooting

### Issue: API calls are going to the wrong URL

**Solution**: Check which environment configuration is being used:
1. Verify the build/serve command you're using
2. Check the corresponding environment file
3. Make sure `angular.json` has the correct file replacements

### Issue: Changes to environment files not reflected

**Solution**:
1. Stop the development server
2. Clear the Angular build cache: `rm -rf .angular`
3. Restart the development server: `ng serve`
