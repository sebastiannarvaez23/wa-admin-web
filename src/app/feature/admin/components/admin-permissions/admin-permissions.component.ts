import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { AdminModule, FeatureCatalogItem } from '../../interfaces/admin-users.interfaces';
import { AdminUserManagementService } from '../../services/admin-user-management.service';

interface Role {
    id: string;
    name: string;
    description?: string;
    is_active?: boolean;
    is_generic?: boolean;
    is_editable?: boolean;
}

interface RoleForm {
    name: string;
    description: string;
}

interface ModuleFeature {
    key: string;
    label: string;
    enabled: boolean;
    category: string;
}

interface RoleModuleAccess {
    module: string;
    moduleName: string;
    moduleIcon: string;
    hasAccess: boolean;
    features: ModuleFeature[];
}

interface RolePermissionRow {
    role: Role;
    modules: RoleModuleAccess[];
}

@Component({
    selector: 'wa-admin-permissions',
    templateUrl: './admin-permissions.component.html',
    styleUrls: ['../admin-shared.css', './admin-permissions.component.css'],
})
export class AdminPermissionsComponent implements OnInit {

    modules: AdminModule[] = [];
    rolePermissions: RolePermissionRow[] = [];
    selectedRoleId: string | null = null;
    loading = false;
    saving = false;
    saved = false;

    // Feature detail modal
    showDetailModal = false;
    currentDetailModule: RoleModuleAccess | null = null;
    currentDetailGroups: { category: string; features: ModuleFeature[] }[] = [];

    // Role create/edit modal
    showRoleModal = false;
    editingRole: Role | null = null;
    roleForm: RoleForm = { name: '', description: '' };

    private catalogByModule = new Map<string, FeatureCatalogItem[]>();

    constructor(private svc: AdminUserManagementService) {}

    ngOnInit(): void {
        this.loading = true;
        forkJoin({
            modules: this.svc.getModules(),
            roles: this.svc.getRoles(),
            catalog: this.svc.getFeaturesCatalog(),
        }).subscribe({
            next: ({ modules, roles, catalog }) => {
                this.modules = modules
                    .filter(m => m.is_active)
                    .sort((a, b) => a.section_order - b.section_order || a.order - b.order);

                this.catalogByModule.clear();
                for (const item of catalog) {
                    if (!this.catalogByModule.has(item.module)) {
                        this.catalogByModule.set(item.module, []);
                    }
                    this.catalogByModule.get(item.module)!.push(item);
                }

                this.rolePermissions = roles.map(role => {
                    const enabledKeys = new Set(role.features ?? []);
                    const enabledModules = new Set(role.modules ?? []);
                    return {
                        role: {
                            id: role.id,
                            name: role.name,
                            description: role.description,
                            is_active: role.is_active ?? true,
                            is_generic: role.is_generic ?? false,
                            is_editable: role.is_editable ?? true,
                        },
                        modules: this.modules.map(m => {
                            const features = this.buildFeatures(m.code, enabledKeys);
                            return {
                                module: m.code,
                                moduleName: m.name,
                                moduleIcon: m.icon,
                                hasAccess: enabledModules.has(m.code) || features.some(f => f.enabled),
                                features,
                            };
                        }),
                    };
                });

                this.selectedRoleId = roles[0]?.id ?? null;
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    private buildFeatures(moduleCode: string, enabledKeys: Set<string> = new Set()): ModuleFeature[] {
        const items = this.catalogByModule.get(moduleCode) ?? [];
        return items.map(item => ({
            key: item.key,
            label: item.label,
            enabled: enabledKeys.has(item.key),
            category: item.category,
        }));
    }

    get selectedRow(): RolePermissionRow | undefined {
        return this.rolePermissions.find(r => r.role.id === this.selectedRoleId);
    }

    selectRole(role: Role): void {
        this.selectedRoleId = role.id;
    }

    getInitials(role: Role): string {
        return role.name.substring(0, 2).toUpperCase();
    }

    getRoleClass(roleName: string): string {
        const lower = (roleName ?? '').toLowerCase();
        if (lower.includes('admin')) return 'admin';
        if (lower.includes('operario') || lower.includes('operator')) return 'operator';
        return 'viewer';
    }

    toggleModuleAccess(moduleAccess: RoleModuleAccess): void {
        if (moduleAccess.hasAccess) {
            moduleAccess.hasAccess = false;
            moduleAccess.features.forEach(f => f.enabled = false);
        } else {
            moduleAccess.hasAccess = true;
        }
    }

    openDetailModal(module: string): void {
        this.currentDetailModule = this.selectedRow?.modules.find(m => m.module === module) ?? null;
        if (this.currentDetailModule) {
            const map = new Map<string, ModuleFeature[]>();
            for (const f of this.currentDetailModule.features) {
                if (!map.has(f.category)) map.set(f.category, []);
                map.get(f.category)!.push(f);
            }
            this.currentDetailGroups = Array.from(map.entries()).map(([category, features]) => ({ category, features }));
        } else {
            this.currentDetailGroups = [];
        }
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.currentDetailModule = null;
        this.currentDetailGroups = [];
    }

    savePermissions(): void {
        const row = this.selectedRow;
        if (!row) return;
        const featureKeys = row.modules
            .flatMap(m => m.features)
            .filter(f => f.enabled)
            .map(f => f.key);
        const moduleCodes = row.modules
            .filter(m => m.hasAccess)
            .map(m => m.module);

        this.saving = true;
        this.svc.updateRoleFeatures(row.role.id, featureKeys, moduleCodes).subscribe({
            next: () => {
                this.saving = false;
                this.saved = true;
                setTimeout(() => this.saved = false, 3000);
            },
            error: () => { this.saving = false; },
        });
    }

    // ── Role modal ────────────────────────────────────────────────────────────

    openCreateRoleModal(): void {
        this.editingRole = null;
        this.roleForm = { name: '', description: '' };
        this.showRoleModal = true;
    }

    openEditRoleModal(role: Role, event: Event): void {
        event.stopPropagation();
        this.editingRole = role;
        this.roleForm = { name: role.name, description: role.description ?? '' };
        this.showRoleModal = true;
    }

    toggleRoleActive(row: RolePermissionRow, event: Event): void {
        event.stopPropagation();
        const newActive = !(row.role.is_active ?? true);
        const request$ = row.role.is_generic
            ? this.svc.toggleCompanyAccess(row.role.id, newActive)
            : this.svc.updateRole(row.role.id, { is_active: newActive });

        request$.subscribe({
            next: updated => {
                row.role.is_active = updated.is_active;
                if (this.selectedRoleId === row.role.id && !row.role.is_active) {
                    const next = this.rolePermissions.find(r => r.role.id !== row.role.id && (r.role.is_active ?? true));
                    this.selectedRoleId = next?.role.id ?? null;
                }
            },
        });
    }

    closeRoleModal(): void {
        this.showRoleModal = false;
        this.editingRole = null;
        this.roleForm = { name: '', description: '' };
    }

    saveRole(): void {
        if (!this.roleForm.name.trim()) return;

        if (this.editingRole) {
            this.svc.updateRole(this.editingRole.id, {
                name: this.roleForm.name,
                description: this.roleForm.description,
            }).subscribe({
                next: updated => {
                    if (this.editingRole) {
                        this.editingRole.name = updated.name ?? this.editingRole.name;
                        this.editingRole.description = updated.description;
                    }
                    this.closeRoleModal();
                },
            });
        } else {
            this.svc.createRole({
                name: this.roleForm.name,
                description: this.roleForm.description,
            }).subscribe({
                next: created => {
                    this.rolePermissions.push({
                        role: { id: created.id, name: created.name, description: created.description, is_active: created.is_active ?? true },
                        modules: this.modules.map(m => ({
                            module: m.code,
                            moduleName: m.name,
                            moduleIcon: m.icon,
                            hasAccess: false,
                            features: this.buildFeatures(m.code),
                        })),
                    });
                    this.selectedRoleId = created.id;
                    this.closeRoleModal();
                },
            });
        }
    }
}
