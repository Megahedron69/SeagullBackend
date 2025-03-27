import prisma from "../config/prisma";
import * as argon2 from "argon2";
import { ApiError } from "../middlewares/errorMiddleware";
import { generateTokens, isMyTokenValid } from "../utils/jwtUtil";
import { supabase } from "../config/supabase";

const createUser = async (
  email: string,
  password: string,
  mobileNumber?: string | null
) => {
  try {
    const isExistingUser = await prisma.user.findUnique({ where: { email } });
    if (isExistingUser) throw new ApiError(400, "Email already in use");

    const hashedPassword = await argon2.hash(password);
    const user = await prisma.user.create({
      data: {
        email,
        mobileNumber,
        password: hashedPassword,
        authMethods: { set: ["EMAIL_PASS"] },
      },
    });
    return user;
  } catch (error: any) {
    throw new ApiError(500, "Failed to create user", [
      { reason: error.message },
    ]);
  }
};

const saveRefreshToken = async (userId: string, refreshToken: string) => {
  await prisma.user.update({ where: { id: userId }, data: { refreshToken } });
};

const verifyUser = async (email: string, password: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new ApiError(401, "Invalid credentials");

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

    return user;
  } catch (error: any) {
    throw new ApiError(500, "Failed to verify user", [
      { reason: error.message },
    ]);
  }
};

const refreshTokenService = async (refreshToken: string) => {
  try {
    if (!refreshToken) throw new ApiError(403, "Refresh token missing");

    const decodedToken = isMyTokenValid(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!
    );
    if (!decodedToken || !decodedToken.id)
      throw new ApiError(403, "Invalid refresh token");

    const user = await prisma.user.findUnique({
      where: { id: decodedToken.id },
    });
    if (!user) throw new ApiError(404, "User not found");

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.email
    );
    await saveRefreshToken(user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error: any) {
    throw new ApiError(500, "Unable to refresh token", [
      { reason: error.message },
    ]);
  }
};

const logoutService = async (userId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  } catch (error: any) {
    throw new ApiError(500, "Logout failed", [{ reason: error.message }]);
  }
};

const googleSignIn = async (idToken: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });

    if (error) throw new ApiError(401, error.message);

    let user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.user.email!,
          username: data.user.user_metadata.full_name || null,
          authMethods: { set: ["GOOGLE"] },
          emailVerified: true,
        },
      });
    }

    const { accessToken: jwtAccessToken, refreshToken } = generateTokens(
      user.id,
      user.email
    );
    await saveRefreshToken(user.id, refreshToken);

    return { user, accessToken: jwtAccessToken, refreshToken };
  } catch (error: any) {
    throw new ApiError(500, "Google authentication failed", [
      { reason: error.message },
    ]);
  }
};

export {
  createUser,
  verifyUser,
  refreshTokenService,
  saveRefreshToken,
  logoutService,
  googleSignIn,
};
