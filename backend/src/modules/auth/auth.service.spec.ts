import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../users/schemas/user.schema';
import { RefreshToken } from './schemas/refresh-token.schema';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userModel: any;
  let refreshTokenModel: any;
  let jwtService: JwtService;

  const mockUser = {
    _id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockRefreshTokenModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.secret': 'test-secret',
        'jwt.expiresIn': '15m',
        'jwt.refreshSecret': 'test-refresh-secret',
        'jwt.refreshExpiresIn': '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: mockRefreshTokenModel,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get(getModelToken(User.name));
    refreshTokenModel = module.get(getModelToken(RefreshToken.name));
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'Password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
        username: registerDto.username,
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockUserModel.findOne).toHaveBeenCalled();
      expect(mockUserModel.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password123',
      };

      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if username already exists', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        username: 'existinguser',
        password: 'Password123',
      };

      mockUserModel.findOne.mockResolvedValue({
        ...mockUser,
        username: registerDto.username,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'Password123',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(mockUserModel.findOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        usernameOrEmail: 'nonexistent',
        password: 'Password123',
      };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        usernameOrEmail: 'testuser',
        password: 'WrongPassword',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should successfully refresh tokens', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockTokenDoc = {
        _id: 'token123',
        userId: mockUser._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
      };

      mockRefreshTokenModel.findOne.mockResolvedValue(mockTokenDoc);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockRefreshTokenModel.updateOne.mockResolvedValue({});
      mockJwtService.sign.mockReturnValue('new-jwt-token');
      mockRefreshTokenModel.create.mockResolvedValue({});

      const result = await service.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockRefreshTokenModel.findOne).toHaveBeenCalledWith({
        token: refreshToken,
        revoked: false,
      });
      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockRefreshTokenModel.findOne.mockResolvedValue(null);

      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const refreshToken = 'expired-refresh-token';
      const mockTokenDoc = {
        _id: 'token123',
        userId: mockUser._id,
        token: refreshToken,
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
      };

      mockRefreshTokenModel.findOne.mockResolvedValue(mockTokenDoc);
      mockRefreshTokenModel.deleteOne.mockResolvedValue({});

      await expect(service.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const refreshToken = 'valid-refresh-token';

      mockRefreshTokenModel.updateOne.mockResolvedValue({});

      await service.logout(refreshToken);

      expect(mockRefreshTokenModel.updateOne).toHaveBeenCalledWith(
        { token: refreshToken },
        { revoked: true },
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser._id);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(mockUser._id);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.validateUser('nonexistent')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

// Made with Bob
