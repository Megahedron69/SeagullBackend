import { type Request, type Response, type NextFunction } from "express";
import { ApiError } from "../middlewares/errorMiddleware";
import { checkHealth } from "../services/health.service";

export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const healthStatus = await checkHealth();
    res.status(200).json(healthStatus);
  } catch (error) {
    next(
      new ApiError(500, "Health check failed", [
        { reason: (error as Error).message },
      ])
    );
  }
};
