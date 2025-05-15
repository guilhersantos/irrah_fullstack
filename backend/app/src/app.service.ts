import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Bem-vindo à API do Big Chat Brasil (BCB) - Sistema de Comunicação Empresarial';
  }
}
