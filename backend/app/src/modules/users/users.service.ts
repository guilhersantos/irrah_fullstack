import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Criar novo usuário
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Salvar usuário
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
    return user;
  }

  async findByName(name: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { name } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Se a senha foi fornecida, hash ela
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Atualizar usuário
    await this.usersRepository.update(id, updateUserDto);
    
    // Retornar usuário atualizado
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }
  }

  async validateUser(name: string, password: string): Promise<User | null> {
    const user = await this.findByName(name);
    
    if (!user) {
      return null;
    }

    // Verificar se o usuário está ativo
    if (!user.active) {
      return null;
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
