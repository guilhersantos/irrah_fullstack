import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { runSeeds } from './index';

@Module({
  imports: [TypeOrmModule.forFeature()],
})
export class SeedModule implements OnModuleInit {
  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      console.log('Iniciando módulo de seeds...');
      await runSeeds(this.dataSource);
    } catch (error) {
      console.error('Erro ao executar seeds:', error);
    }
  }
}
