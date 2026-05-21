import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RefreshToken, RefreshTokenDocument } from './schemas/refresh-token.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name) private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.userModel.create({
      email,
      username,
      passwordHash,
    });

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { usernameOrEmail, password } = loginDto;

    // Find user by email or username
    const user = await this.userModel.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    // Find refresh token in database
    const tokenDoc = await this.refreshTokenModel.findOne({
      token: refreshToken,
      revoked: false,
    });

    if (!tokenDoc) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (tokenDoc.expiresAt < new Date()) {
      await this.refreshTokenModel.deleteOne({ _id: tokenDoc._id });
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user
    const user = await this.userModel.findById(tokenDoc.userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token
    await this.refreshTokenModel.updateOne(
      { _id: tokenDoc._id },
      { revoked: true },
    );

    // Generate new tokens
    return this.generateAuthResponse(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { revoked: true },
    );
  }

  async validateUser(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateAuthResponse(user: UserDocument): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    });

    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    
    // Calculate expiration date
    const expiresAt = new Date();
    const days = parseInt(refreshExpiresIn.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + days);

    // Store refresh token
    await this.refreshTokenModel.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    };
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
  }
}

// Made with Bob
