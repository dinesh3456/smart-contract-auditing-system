// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { validateRegistration, validateLogin } from "../utils/validator";
import { logger } from "../utils/logger";
import { generateToken } from "../utils/jwt";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, company } = req.body;

      // Validate user input
      const validationResult = validateRegistration(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: "Invalid registration data",
          errors: validationResult.errors,
        });
        return;
      }

      // Check if user already exists
      const existingUser = await this.userService.findUserByEmail(email);
      if (existingUser) {
        res
          .status(409)
          .json({ success: false, message: "Email is already registered" });
        return;
      }

      // Create new user
      const user = await this.userService.createUser({
        email,
        password,
        name,
        company,
      });

      // Generate authentication token
      const token = generateToken({
        id: String(user._id),
        email: user.email,
        name: user.name,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          company: user.company,
        },
      });
    } catch (error) {
      logger.error("Error registering user:", error);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  };

  /**
   * User login
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate login input
      const validationResult = validateLogin(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: "Invalid login data",
          errors: validationResult.errors,
        });
        return;
      }

      // Verify user credentials
      const user = await this.userService.verifyCredentials(email, password);
      if (!user) {
        res
          .status(401)
          .json({ success: false, message: "Invalid email or password" });
        return;
      }

      // Generate authentication token
      const token = generateToken({
        id: String(user._id),
        email: user.email,
        name: user.name,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          company: user.company,
        },
      });
    } catch (error) {
      logger.error("Error during login:", error);
      res.status(500).json({ success: false, message: "Login failed" });
    }
  };

  /**
   * Get user profile
   */
  public getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const user = await this.userService.getUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          company: user.company,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error fetching user profile:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch user profile" });
    }
  };

  /**
   * Update user profile
   */
  public updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const updates: { [key: string]: any } = {
        name: req.body.name,
        company: req.body.company,
        // Password update would require additional verification
      };

      // Remove undefined fields
      Object.keys(updates).forEach(
        (key) => updates[key] === undefined && delete updates[key]
      );

      // Check if there's anything to update
      if (Object.keys(updates).length === 0) {
        res
          .status(400)
          .json({ success: false, message: "No valid update fields provided" });
        return;
      }

      const updatedUser = await this.userService.updateUser(userId, updates);
      if (!updatedUser) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          company: updatedUser.company,
        },
      });
    } catch (error) {
      logger.error("Error updating user profile:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update profile" });
    }
  };

  /**
   * User logout
   * Note: In a JWT-based auth system, the actual token invalidation would happen client-side
   * This endpoint is mainly for analytics or to support token blacklisting if implemented
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a more complex implementation, we might add the token to a blacklist
      // For now, just return a success response

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      logger.error("Error during logout:", error);
      res.status(500).json({ success: false, message: "Logout failed" });
    }
  };
}
