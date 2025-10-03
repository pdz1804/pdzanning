# Azure Deployment Guide for pdzanning

This guide will help you deploy your pdzanning application to Azure services:
- **Frontend**: Azure Static Web Apps
- **Backend**: Azure App Service

## Prerequisites

Before starting, ensure you have:
- Azure CLI installed and logged in
- GitHub repository access (https://github.com/pdz1804/pdzanning)
- MongoDB Atlas account (for database)
- Azure subscription with appropriate permissions

## Step 1: Prepare Your Repository

### 1.1 Update Frontend API Configuration

You'll need to update your frontend to use the production backend URL. Create a production configuration:

1. **Update `frontend/src/lib/api.ts`** to use environment-based API URLs:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
   ```

2. **Create `frontend/.env.production`**:
   ```env
   VITE_API_URL=https://your-backend-app-name.azurewebsites.net
   ```

### 1.2 Create Azure Static Web App Configuration

Create `staticwebapp.config.json` in your frontend directory:
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,jpeg,gif,svg}", "/css/*", "/js/*"]
  },
  "mimeTypes": {
    ".json": "application/json"
  }
}
```

## Step 2: Deploy Backend to Azure App Service

### 2.1 Create Resource Group

```bash
# Create a resource group (replace with your preferred region)
az group create --name pdzanning-rg --location "East US"
```

### 2.2 Create App Service Plan

```bash
# Create an App Service plan (Free tier for testing, Basic for production)
az appservice plan create --name pdzanning-plan --resource-group pdzanning-rg --sku FREE --is-linux
```

### 2.3 Create Web App

```bash
# Create the web app
az webapp create --resource-group pdzanning-rg --plan pdzanning-plan --name pdzanning-backend --runtime "NODE:18-lts"
```

### 2.4 Configure Application Settings

Set your environment variables in Azure:

```bash
# Set MongoDB connection
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings MONGODB_URI="your-mongodb-atlas-connection-string"

# Set JWT secrets (generate strong secrets for production)
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings JWT_ACCESS_SECRET="your-super-secret-access-key"
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Set production environment
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings NODE_ENV="production"
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings PORT="8080"

# Set CORS origins (update with your Static Web App URL after deployment)
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings ALLOWED_ORIGINS="https://your-static-web-app-url.azurestaticapps.net"
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings FRONTEND_URL="https://your-static-web-app-url.azurestaticapps.net"
```

### 2.5 Configure Deployment from GitHub

```bash
# Configure GitHub deployment
az webapp deployment source config --resource-group pdzanning-rg --name pdzanning-backend --repo-url https://github.com/pdz1804/pdzanning --branch main --manual-integration
```

### 2.6 Create Deployment Script

Create `.deployment` file in your project root:
```
[config]
command = bash deploy.sh
```

Create `deploy.sh` in your project root:
```bash
#!/bin/bash

# Install dependencies and build backend
cd backend
npm ci --only=production
npm run build

# Move built files to deployment directory
cp -r dist/* ../deployment/
cp package*.json ../deployment/

cd ../deployment
npm ci --only=production
```

## Step 3: Deploy Frontend to Azure Static Web Apps

### 3.1 Create Static Web App

```bash
# Create Static Web App connected to GitHub
az staticwebapp create \
  --name pdzanning-frontend \
  --resource-group pdzanning-rg \
  --source https://github.com/pdz1804/pdzanning \
  --location "East US 2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "dist" \
  --login-with-github
```

### 3.2 Configure Build Settings

The Static Web App will automatically detect your Vite build configuration. Ensure your `frontend/vite.config.ts` has the correct base path:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### 3.3 Update Backend CORS Settings

After the Static Web App is deployed, get its URL and update your backend CORS settings:

```bash
# Get the Static Web App URL
az staticwebapp show --name pdzanning-frontend --resource-group pdzanning-rg --query "defaultHostname" -o tsv

# Update backend CORS with the actual URL
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings ALLOWED_ORIGINS="https://pdzanning-frontend.azurestaticapps.net"
az webapp config appsettings set --resource-group pdzanning-rg --name pdzanning-backend --settings FRONTEND_URL="https://pdzanning-frontend.azurestaticapps.net"
```

## Step 4: Configure Custom Domain (Optional)

### 4.1 For Static Web App

```bash
# Add custom domain to Static Web App
az staticwebapp hostname set \
  --name pdzanning-frontend \
  --resource-group pdzanning-rg \
  --hostname your-domain.com
```

### 4.2 For App Service

```bash
# Add custom domain to App Service
az webapp config hostname add --webapp-name pdzanning-backend --resource-group pdzanning-rg --hostname api.your-domain.com
```

## Step 5: SSL Configuration

Both services automatically get SSL certificates. For custom domains, you may need to configure SSL:

```bash
# Configure SSL for App Service
az webapp config ssl bind --certificate-thumbprint YOUR_THUMBPRINT --ssl-type SNI --name pdzanning-backend --resource-group pdzanning-rg
```

## Step 6: Environment-Specific Configuration

### 6.1 Update Frontend Environment

Create environment-specific files:

**`frontend/.env.production`**:
```env
VITE_API_URL=https://pdzanning-backend.azurewebsites.net
```

**`frontend/.env.development`**:
```env
VITE_API_URL=http://localhost:3001
```

### 6.2 Update Backend for Production

Ensure your backend handles production environment correctly:

1. **Update `backend/src/index.ts`** to use PORT from environment:
   ```typescript
   const PORT = process.env.PORT || 3001;
   ```

2. **Add health check endpoint**:
   ```typescript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
   });
   ```

## Step 7: Monitoring and Logging

### 7.1 Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create --app pdzanning-insights --location "East US" --resource-group pdzanning-rg --application-type web

# Link to App Service
az monitor app-insights component connect-webapp --app pdzanning-insights --resource-group pdzanning-rg --web-app pdzanning-backend
```

### 7.2 Configure Logging

```bash
# Enable application logging
az webapp log config --resource-group pdzanning-rg --name pdzanning-backend --application-logging true --level information
```

## Step 8: Security Configuration

### 8.1 Configure Authentication (Optional)

For production, consider adding authentication to your Static Web App:

```bash
# Configure authentication provider
az staticwebapp auth update \
  --name pdzanning-frontend \
  --resource-group pdzanning-rg \
  --provider github
```

### 8.2 Network Security

Configure App Service networking:

```bash
# Enable HTTPS only
az webapp update --resource-group pdzanning-rg --name pdzanning-backend --https-only true
```

## Step 9: Testing Your Deployment

### 9.1 Test Backend

```bash
# Test health endpoint
curl https://pdzanning-backend.azurewebsites.net/health

# Test API endpoints
curl https://pdzanning-backend.azurewebsites.net/api/auth/me
```

### 9.2 Test Frontend

1. Visit your Static Web App URL
2. Test user registration/login
3. Verify API connectivity
4. Test all major features

## Step 10: CI/CD Configuration

### 10.1 GitHub Actions for Backend

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend
        npm ci
        
    - name: Build
      run: |
        cd backend
        npm run build
        
    - name: Deploy to Azure
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'pdzanning-backend'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: './backend'
```

### 10.2 GitHub Actions for Frontend

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend to Static Web App

on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
        
    - name: Build
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to Static Web App
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
        repo_token: ${{ secrets.GITHUB_TOKEN }}
        action: "upload"
        app_location: "/frontend"
        output_location: "dist"
```

## Step 11: Cost Optimization

### 11.1 App Service Scaling

```bash
# Configure auto-scaling rules
az monitor autoscale create \
  --resource pdzanning-plan \
  --resource-group pdzanning-rg \
  --resource-type Microsoft.Web/serverfarms \
  --name pdzanning-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1
```

### 11.2 Static Web App Optimization

- Enable CDN for better performance
- Configure caching headers
- Optimize images and assets

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure ALLOWED_ORIGINS includes your Static Web App URL
2. **Build Failures**: Check Node.js version compatibility
3. **Database Connection**: Verify MongoDB Atlas network access
4. **Environment Variables**: Ensure all required variables are set in Azure

### Useful Commands

```bash
# View logs
az webapp log tail --name pdzanning-backend --resource-group pdzanning-rg

# Restart app
az webapp restart --name pdzanning-backend --resource-group pdzanning-rg

# Check app status
az webapp show --name pdzanning-backend --resource-group pdzanning-rg --query "state"
```

## Final Checklist

- [ ] Backend deployed to Azure App Service
- [ ] Frontend deployed to Azure Static Web Apps
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] SSL certificates configured
- [ ] Custom domains configured (if applicable)
- [ ] Monitoring enabled
- [ ] CI/CD pipelines configured
- [ ] Application tested end-to-end
- [ ] Cost monitoring configured

## URLs After Deployment

- **Frontend**: `https://pdzanning-frontend.azurestaticapps.net`
- **Backend**: `https://pdzanning-backend.azurewebsites.net`
- **Health Check**: `https://pdzanning-backend.azurewebsites.net/health`

## Support

If you encounter issues:
1. Check Azure portal logs
2. Verify environment variables
3. Test API endpoints individually
4. Check GitHub Actions logs for CI/CD issues
5. Review Azure documentation for specific service configurations

---

**Note**: Replace placeholder values (like `your-mongodb-atlas-connection-string`, `your-super-secret-access-key`) with your actual production values. Never commit secrets to your repository.
