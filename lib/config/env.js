import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  appUrl: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
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
