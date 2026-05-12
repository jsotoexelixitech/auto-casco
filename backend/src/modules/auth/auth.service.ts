import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, UserPublicDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('El email ya está registrado');
    }

    const rounds = this.config.get<number>('bcrypt.rounds') ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, rounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: 'asegurado',
        phone: dto.phone,
        documento: dto.documento,
        avatar: dto.name
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      },
    });

    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<UserPublicDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        title: true,
        avatar: true,
        color: true,
        phone: true,
        documento: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    title?: string | null;
    avatar?: string | null;
    color?: string | null;
    phone?: string | null;
    documento?: string | null;
  }): Promise<AuthResponseDto> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const expiresInRaw = this.config.get<string>('jwt.expiresIn') ?? '1d';
    const expiresIn = this.parseExpires(expiresInRaw);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title ?? null,
        avatar: user.avatar ?? null,
        color: user.color ?? null,
        phone: user.phone ?? null,
        documento: user.documento ?? null,
      },
    };
  }

  /** "1d" -> 86400, "2h" -> 7200, número -> número */
  private parseExpires(s: string): number {
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    const m = /^(\d+)([smhd])$/.exec(s);
    if (!m) return 86400;
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const mult = { s: 1, m: 60, h: 3600, d: 86400 }[unit] ?? 1;
    return n * mult;
  }
}
