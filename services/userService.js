const User = require("../models/User");

class UserService {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async saveUser(userData) {
    try {
      const user = new User(userData);
      const savedUser = await user.save();

      // Optional: Send welcome email
      if (this.emailService) {
        try {
          await this.emailService.sendThankYouEmail(
            savedUser.email,
            savedUser.firstName
          );
        } catch (emailError) {
          console.error("Email sending failed:", emailError.message);
        }
      }

      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error("Email already exists");
      }
      throw error;
    }
  }

  async getUserById(id) {
    return await User.findById(id).select('-password');
  }

  async getUserByEmail(email) {
    return await User.findOne({ email }).select("-password");
  }

  async getAllUsers() {
    return await User.find().select("-password");
  }

  async updateUser(email, updatedData) {
    return await User.findOneAndUpdate(
      { email },
      { $set: updatedData },
      { new: true, runValidators: true } // Ensures validation runs on update
    ).select("-password");
  }

  async deleteUser(email) {
    const result = await User.deleteOne({ email });
    return result.deletedCount > 0;
  }

  // async getUserById(userId) {
  //   const user = await User.findById(userId);
  //   console.log(user);
  //   if (!user) throw new Error("User not found");
  //   return user;
  // }
}

module.exports = new UserService();
