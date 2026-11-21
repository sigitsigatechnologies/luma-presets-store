import dotenv from "dotenv";
dotenv.config();

function resolveAppUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  appUrl: resolveAppUrl(),

  midtrans: {
    serverKey: (process.env.MIDTRANS_SERVER_KEY || "").trim(),
    clientKey: (process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "").trim(),
    signatureKey: (process.env.MIDTRANS_SIGNATURE_KEY || "").trim(),
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true" || process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
  },

  database: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || ""
  },

  fonnte: {
    token: process.env.FONNTE_TOKEN || ""
  },

  adminUser: process.env.ADMIN_USER || "admin",
  adminPass: process.env.ADMIN_PASS || "admin123"
};
