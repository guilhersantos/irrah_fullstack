import { DataSource } from 'typeorm';
import { createAdminUser } from './admin-user.seed';

export const runSeeds = async (dataSource: DataSource): Promise<void> => {
  console.log('Iniciando execução de seeds...');
  
  // Executar seeds
  await createAdminUser(dataSource);
  
  console.log('Seeds executados com sucesso!');
};
