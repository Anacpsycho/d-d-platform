import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-passwordHash').exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).select('-passwordHash').exec();
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    const { email, username, currentPassword, newPassword } = updateUserDto;

    const user = await this.userModel.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await this.findByUsername(username);
      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
      user.username = username;
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        throw new ConflictException('Current password is required to set a new password');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new ConflictException('Current password is incorrect');
      }

      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    }

    await user.save();

    // Return user without password hash
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id });
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getUserStats(id: string): Promise<any> {
    const user = await this.findOne(id);
    
    // This can be extended to include character count, campaign count, etc.
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      // Add more stats as needed
    };
  }
}

// Made with Bob
