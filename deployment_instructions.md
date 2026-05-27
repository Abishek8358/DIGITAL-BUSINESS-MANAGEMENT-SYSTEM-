# Deployment Instructions - CoreBiz MERN Stack

This document contains step-by-step instructions for deploying your migrated application permanently to the cloud.

---

## 1. Database Setup: MongoDB Atlas

1. **Create an Account**: Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Deploy a Free Cluster**: Choose the shared free tier (M0) in a region of your choice.
3. **Database User**: Create a database user with username and password under the **Database Access** section. Make sure the role is set to `Read and Write to any database` or owner.
4. **Network Access**: Add IP `0.0.0.0/0` under the **Network Access** section to allow incoming connections from your hosting providers (Render/Vercel).
5. **Get Connection URI**: Go to the Clusters dashboard, click **Connect** -> **Drivers**, and copy the connection string.
   - Example connection string: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/corebiz?retryWrites=true&w=majority`

---

## 2. Backend Deployment: Render

Render will automatically deploy your Express API server using the repository's `render.yaml` configuration.

1. **Sign Up / Log In**: Create an account on [Render](https://render.com).
2. **Connect GitHub**: Link your GitHub repository containing the project.
3. **Create Blueprint**: Go to the Render dashboard, click **New +** -> **Blueprint**.
4. **Select Repository**: Pick your repository. Render will automatically parse the `render.yaml` configuration file.
5. **Set Environment Variables**: In the deployment setup page, define:
   - `MONGO_URI`: The connection string copied from MongoDB Atlas.
   - `JWT_SECRET`: A secure random secret key (e.g., `my_secure_jwt_token_secret_key`).
6. **Deploy**: Render will automatically build and spin up the Express server.

---

## 3. Frontend Deployment: Vercel

1. **Sign Up / Log In**: Sign up or log in to [Vercel](https://vercel.com).
2. **Import Repository**: Click **Add New** -> **Project**, select your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. **Environment Variables**: Add your frontend environment variables:
   - `VITE_API_URL`: The URL of your live Render backend API (e.g., `https://corebiz-backend.onrender.com`).
5. **Deploy**: Click **Deploy**. Vercel will build the React application and deploy it globally.
