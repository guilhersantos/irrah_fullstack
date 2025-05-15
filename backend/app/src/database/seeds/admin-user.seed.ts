import { DataSource } from 'typeorm';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export const createAdminUser = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(User);
  
  // Verificar se já existe um usuário administrador
  const existingAdmin = await userRepository.findOne({
    where: { role: UserRole.ADMIN }
  });
  
  if (existingAdmin) {
    console.log('Usuário administrador já existe. Pulando criação.');
    return;
  }
  
  // Criar senha hash
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Criar usuário administrador
  const adminUser = userRepository.create({
    name: 'admin',
    password: hashedPassword,
    role: UserRole.ADMIN,
    active: true
  });
  
  await userRepository.save(adminUser);
  
  console.log('Usuário administrador criado com sucesso:');
  console.log('- Nome de usuário: admin');
  console.log('- Senha: admin123');
  console.log('- Papel: ADMIN');
};
