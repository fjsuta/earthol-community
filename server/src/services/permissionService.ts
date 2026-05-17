import pool from '../config/database';

interface Permission {
  permission_code: string;
  permission_name: string;
  category: string;
}

interface Role {
  id: number;
  role_code: string;
  role_name: string;
  permissions: any;
}

class PermissionService {
  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      // 获取用户角色
      const [users] = await pool.execute(
        `SELECT u.is_admin, u.admin_role_id, u.role as user_role, ar.role_code, ar.permissions
         FROM users u
         LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
         WHERE u.id = ?`,
        [userId]
      );

      if ((users as any[]).length === 0) {
        return [];
      }

      const user = (users as any[])[0];
      const permissions: string[] = [];

      // 普通用户权限
      if (user.user_role === 'admin') {
        permissions.push('users.view', 'users.edit', 'users.ban');
      }
      if (user.user_role === 'moderator') {
        permissions.push('posts.view', 'posts.review', 'posts.delete');
      }

      // 管理员额外权限
      if (user.is_admin && user.role_code) {
        const rolePermissions = user.permissions;
        if (rolePermissions && typeof rolePermissions === 'object') {
          if (rolePermissions.all) {
            // 超级管理员拥有所有权限
            const [allPerms] = await pool.execute('SELECT permission_code FROM permissions');
            permissions.push(...(allPerms as any[]).map((p: any) => p.permission_code));
          } else {
            // 其他角色根据配置添加权限
            Object.entries(rolePermissions).forEach(([key, value]: [string, any]) => {
              if (value === true) {
                const categoryPerms = this.getCategoryPermissions(key);
                permissions.push(...categoryPerms);
              }
            });
          }
        }
      }

      return [...new Set(permissions)]; // 去重
    } catch (error) {
      console.error('获取用户权限失败:', error);
      return [];
    }
  }

  private getCategoryPermissions(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      users: ['users.view', 'users.edit', 'users.delete', 'users.ban'],
      posts: ['posts.view', 'posts.review', 'posts.edit', 'posts.delete', 'posts.pin', 'posts.essence'],
      comments: ['comments.view', 'comments.delete'],
      categories: ['categories.manage'],
      announcements: ['announcements.manage'],
      system: ['system.config', 'system.ai', 'system.storage', 'system.database', 'system.icp', 'system.sensitive'],
      roles: ['roles.manage'],
      permissions: ['permissions.manage'],
      oauth: ['oauth.manage'],
      logs: ['logs.view']
    };
    return categoryMap[category] || [];
  }

  async hasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permissionCode);
  }

  async hasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionCodes.some(code => permissions.includes(code));
  }

  async hasAllPermissions(userId: number, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissionCodes.every(code => permissions.includes(code));
  }

  async getAllRoles(): Promise<Role[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT id, role_code, role_name, permissions FROM admin_roles ORDER BY is_system DESC'
      );
      return rows as Role[];
    } catch (error) {
      console.error('获取角色列表失败:', error);
      return [];
    }
  }

  async getRoleById(roleId: number): Promise<Role | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT id, role_code, role_name, permissions FROM admin_roles WHERE id = ?',
        [roleId]
      );
      return (rows as Role[])[0] || null;
    } catch (error) {
      console.error('获取角色失败:', error);
      return null;
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT permission_code, permission_name, category FROM permissions ORDER BY category'
      );
      return rows as Permission[];
    } catch (error) {
      console.error('获取权限列表失败:', error);
      return [];
    }
  }

  async updateUserRole(userId: number, roleId: number | null, isAdmin: boolean): Promise<boolean> {
    try {
      await pool.execute(
        'UPDATE users SET admin_role_id = ?, is_admin = ? WHERE id = ?',
        [roleId, isAdmin, userId]
      );
      return true;
    } catch (error) {
      console.error('更新用户角色失败:', error);
      return false;
    }
  }

  // 权限检查中间件工厂
  requirePermission(permissionCode: string) {
    return async (req: any, res: any, next: Function) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ success: false, message: '未登录' });
        }

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'earthol-secret-key-2024';
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const hasPermission = await this.hasPermission(decoded.userId, permissionCode);
        if (!hasPermission) {
          return res.status(403).json({ success: false, message: '没有权限' });
        }

        req.user = { userId: decoded.userId, username: decoded.username };
        next();
      } catch (error) {
        return res.status(401).json({ success: false, message: '认证失败' });
      }
    };
  }
}

export default new PermissionService();
