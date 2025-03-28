import prisma from "../config/prisma";

export const checkHealth = async () => {
  const statusResponse: Record<string, any> = {
    success: true,
    message: "Server is running smoothly",
    serverTime: new Date().toISOString(),
    uptime: process.uptime(),
  };
  try {
    await prisma.$queryRaw`SELECT 1`;
    statusResponse.database = {
      status: "Connected",
      message: "Database is running fine",
    };
  } catch (error) {
    statusResponse.database = {
      status: "Disconnected",
      message: "Database connection failed",
      error: (error as Error).message,
    };
  }

  return statusResponse;
};
