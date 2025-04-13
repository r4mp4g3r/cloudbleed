# Cloud Deployment Guide for CloudBleed Demo

## Option 1: Deploy to Heroku

1. **Create a Heroku Account**
   Sign up at [Heroku](https://signup.heroku.com/) if you don't have an account.

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Create a new file called `Procfile` in the project root**
   ```
   web: node backend/server.js
   ```

4. **Create a `package.json` in the project root (if not already present)**
   ```json
   {
     "name": "cloudbleed-demo",
     "version": "1.0.0",
     "description": "CloudBleed vulnerability demonstration",
     "main": "backend/server.js",
     "scripts": {
       "start": "node backend/server.js"
     },
     "dependencies": {
       "express": "^4.17.1",
       "cors": "^2.8.5",
       "body-parser": "^1.19.0"
     },
     "engines": {
       "node": "14.x"
     }
   }
   ```

5. **Modify the server port configuration**
   ```javascript
   // In /Users/ram/cloudbleed/backend/server.js
   const PORT = process.env.PORT || 3000;
   ```

6. **Update API base URL to use relative paths**
   ```javascript
   // In /Users/ram/cloudbleed/frontend/js/demo.js
   const API_BASE_URL = '/api';
   ```

7. **Login to Heroku and deploy
