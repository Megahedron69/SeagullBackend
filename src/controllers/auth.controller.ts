import type { Request, Response, NextFunction } from "express";
import {
  createUser,
  logoutService,
  refreshTokenService,
  saveRefreshToken,
  verifyUser,
  googleSignIn,
} from "../services/auth.service";
import { generateTokens, isMyTokenValid } from "../utils/jwtUtil";
import { ApiError } from "../middlewares/errorMiddleware";

const signUpUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, mobileNumber, password } = req.body;
    const user = await createUser(email, password, mobileNumber);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const refreshAccToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refreshToken } = req.body;
    const { accessToken, refreshToken: newRefreshToken } =
      await refreshTokenService(refreshToken);

    return res
      .status(200)
      .json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error: any) {
    next(error);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const user = await verifyUser(email, password);
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);
    await saveRefreshToken(user.id, refreshToken);
    const { password: _, refreshToken: __, ...userData } = user;
    return res.status(200).json({
      success: true,
      user: userData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_token } = req.body;
    if (!id_token) throw new ApiError(400, "Missing id_token");
    const {
      user,
      accessToken: jwtAccessToken,
      refreshToken,
    } = await googleSignIn(id_token);
    return res.status(200).json({
      success: true,
      user,
      accessToken: jwtAccessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    console.log("refreshtoken is", refreshToken);
    if (!refreshToken) throw new ApiError(401, "User not logged in");

    const decodedToken = isMyTokenValid(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );
    if (!decodedToken || !decodedToken.id)
      throw new ApiError(403, "Invalid token payload");

    await logoutService(decodedToken.id);

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    next(error);
  }
};

export { loginUser, logoutUser, signUpUser, refreshAccToken, googleAuth };
