import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      console.log('[RolesGuard] Nenhum papel requerido, permitindo acesso');
      return true;
    }
    
    console.log('[RolesGuard] Papéis requeridos:', requiredRoles);
    
    const { user } = context.switchToHttp().getRequest();
    console.log('[RolesGuard] Usuário da requisição:', user);
    
    if (!user) {
      console.log('[RolesGuard] Usuário não encontrado na requisição');
      return false;
    }
    
    // Verificar se o papel do usuário corresponde a algum dos papéis requeridos
    const hasRole = requiredRoles.some((role) => {
      const matches = user.role === role;
      console.log(`[RolesGuard] Verificando papel ${role} contra ${user.role}: ${matches}`);
      return matches;
    });
    
    console.log('[RolesGuard] Resultado final:', hasRole ? 'Acesso permitido' : 'Acesso negado');
    return hasRole;
  }
}
