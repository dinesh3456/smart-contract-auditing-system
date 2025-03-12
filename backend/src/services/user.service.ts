// src/services/user.service.ts
import { User, IUser } from "../models/user.model";
import { logger } from "../utils/logger";

interface UserCreateData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

interface UserUpdateData {
  name?: string;
  company?: string;
  email?: string;
}

export class UserService {
  /**
   * Find a user by email
   */
  public async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ email });
    } catch (error) {
      logger.error(`Error finding user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  public async createUser(userData: UserCreateData): Promise<IUser> {
    try {
      const user = new User({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        company: userData.company,
      });

      await user.save();
      return user;
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Verify user credentials
   */
  public async verifyCredentials(
    email: string,
    password: string
  ): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return null;
      }

      const isMatch = await user.comparePassword(password);

      return isMatch ? user : null;
    } catch (error) {
      logger.error(`Error verifying credentials for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId);
    } catch (error) {
      logger.error(`Error getting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user
   */
  public async updateUser(
    userId: string,
    updates: UserUpdateData
  ): Promise<IUser | null> {
    try {
      // Filter out undefined/null values
      const filteredUpdates = Object.entries(updates)
        .filter(([_, value]) => value !== undefined && value !== null)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

      // If there are no valid updates, return the current user
      if (Object.keys(filteredUpdates).length === 0) {
        return this.getUserById(userId);
      }

      return await User.findByIdAndUpdate(userId, filteredUpdates, {
        new: true,
      });
    } catch (error) {
      logger.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const user = await User.findById(userId);

      if (!user) {
        return false;
      }

      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);

      if (!isMatch) {
        return false;
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return true;
    } catch (error) {
      logger.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  }
}
