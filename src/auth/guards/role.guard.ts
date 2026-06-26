import { ROLES_KEY } from '@/_core/decorators/roles.decorator';
import { ResourceService } from '@/resource/resource.service';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private resourceService: ResourceService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const currentUser = request.user;

    const resourceType = this.extractResource(request.path);
    if (!resourceType) throw new BadRequestException('Resource type not found');

    const requiredRoles = this.reflector.get(
      ROLES_KEY,
      context.getHandler(),
    ) as IRole[];

    if (!requiredRoles) return true;
    if (requiredRoles.length === 0) return true;
    if (requiredRoles.includes('USER') && currentUser.role === 'USER')
      return true;
    if (
      requiredRoles.includes('BUSINESS_OWNER') &&
      currentUser.role === 'BUSINESS_OWNER'
    ) {
      const userId = currentUser.id;
      const resourceId = request.params.id;

      const userIdOfResource = await this.resourceService.getResource(
        resourceType,
        resourceId,
      );

      if (userId === userIdOfResource) return true;
      throw new ForbiddenException('You can only access your own resources');
    }
    throw new ForbiddenException(
      'You are not authorized to perform this action',
    );
  }

  private extractResource(path: string): string | null {
    const paths = path.split('/');
    if (paths.length > 1) return paths[1];
    return null;
  }
}
