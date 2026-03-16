import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const plugins: any[] = []

if (process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET) {
  plugins.push({
    resolve: "@variablevic/google-analytics-medusa",
    options: {
      measurementId: process.env.GA4_MEASUREMENT_ID,
      apiSecret: process.env.GA4_API_SECRET,
      debug: process.env.GA4_DEBUG === "true",
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:5173,http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000,http://localhost:5173",
      authCors:
        process.env.AUTH_CORS ||
        "http://localhost:9000,http://localhost:5173,http://localhost:8000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  plugins,
})
