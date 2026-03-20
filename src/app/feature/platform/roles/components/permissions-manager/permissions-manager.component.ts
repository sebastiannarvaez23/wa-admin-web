import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { PlatformModule } from '../../../modules/interfaces/module.interfaces';
import {
    CreateRolePayload,
    FeatureCatalogItem,
    PermissionsDataSource,
    RoleSummary,
    RoleWithPermissions,
} from '../../interfaces/role.interfaces';

interface RoleForm {
    name:        string;
    description: string;
}

interface ModuleFeature {
    key:      string;
    label:    string;
    enabled:  boolean;
    category: string;
}

interface RoleModuleAccess {
    module:      string;
    moduleName:  string;
    moduleIcon:  string;
    hasAccess:   boolean;
    features:    ModuleFeature[];
}

interface RolePermissionRow {
    role:    RoleSummary;
    modules: RoleModuleAccess[];
}

@Component({
    selector: 'wa-permissions-manager',
    templateUrl: './permissions-manager.component.html',
    styleUrls: ['./permissions-manager.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsManagerComponent implements OnInit {

    /** Injected by parent — either RoleService or TenantRoleService. */
    @Input() dataSource!: PermissionsDataSource;
    @Input() titleKey  = 'admin.users-roles.permissions.title';
    @Input() subtitleKey = 'admin.users-roles.permissions.subtitle';
    @Input() allowEditGeneric = false;

    modules:         PlatformModule[]     = [];
    rolePermissions: RolePermissionRow[]  = [];
    selectedRoleId:  string | null        = null;
    loading  = false;
    saving   = false;
    saved    = false;

    showDetailModal     = false;
    currentDetailModule: RoleModuleAccess | null = null;
    currentDetailGroups: { category: string; features: ModuleFeature[] }[] = [];

    showRoleModal = false;
    editingRole:  RoleSummary | null = null;
    roleForm: RoleForm = { name: '', description: '' };

    private readonly catalogByModule = new Map<string, FeatureCatalogItem[]>();
    private readonly destroyRef       = inject(DestroyRef);
    private readonly cdr              = inject(ChangeDetectorRef);

    ngOnInit(): void {
        this.loading = true;
        forkJoin({
            modules: this.dataSource.getModules(),
            roles:   this.dataSource.getRoles(),
            catalog: this.dataSource.getFeaturesCatalog(),
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
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

                  this.rolePermissions = this.buildPermissionRows(roles);
                  this.selectedRoleId  = roles[0]?.id ?? null;
                  this.loading = false;
                  this.cdr.markForCheck();
              },
              error: () => { this.loading = false; this.cdr.markForCheck(); },
          });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private buildPermissionRows(roles: RoleWithPermissions[]): RolePermissionRow[] {
        return roles.map(role => {
            const enabledKeys    = new Set(role.features ?? []);
            const enabledModules = new Set(role.modules ?? []);
            return {
                role: {
                    id:          role.id,
                    name:        role.name,
                    description: role.description,
                    is_active:   role.is_active ?? true,
                    is_generic:  role.is_generic ?? false,
                    is_editable: role.is_editable ?? true,
                },
                modules: this.modules.map(m => {
                    const features = this.buildFeatures(m.code, enabledKeys);
                    return {
                        module:     m.code,
                        moduleName: m.name,
                        moduleIcon: m.icon,
                        hasAccess:  enabledModules.has(m.code) || features.some(f => f.enabled),
                        features,
                    };
                }),
            };
        });
    }

    private buildFeatures(moduleCode: string, enabledKeys: Set<string> = new Set()): ModuleFeature[] {
        return (this.catalogByModule.get(moduleCode) ?? []).map(item => ({
            key:      item.key,
            label:    item.label,
            enabled:  enabledKeys.has(item.key),
            category: item.category,
        }));
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    get selectedRow(): RolePermissionRow | undefined {
        return this.rolePermissions.find(r => r.role.id === this.selectedRoleId);
    }

    // ── Role selection ────────────────────────────────────────────────────────

    selectRole(role: RoleSummary): void {
        this.selectedRoleId = role.id;
    }

    getInitials(role: RoleSummary): string {
        return role.name.substring(0, 2).toUpperCase();
    }

    getRoleClass(roleName: string): string {
        const lower = (roleName ?? '').toLowerCase();
        if (lower.includes('admin')) return 'admin';
        if (lower.includes('operario') || lower.includes('operator')) return 'operator';
        return 'viewer';
    }

    // ── TrackBy ───────────────────────────────────────────────────────────────

    trackByRoleId(_: number, row: RolePermissionRow): string { return row.role.id; }
    trackByModule(_: number, m: RoleModuleAccess): string    { return m.module; }
    trackByFeatureKey(_: number, f: ModuleFeature): string   { return f.key; }
    trackByCategory(_: number, g: { category: string }): string { return g.category; }

    // ── Module access ─────────────────────────────────────────────────────────

    toggleModuleAccess(moduleAccess: RoleModuleAccess): void {
        if (moduleAccess.hasAccess) {
            moduleAccess.hasAccess = false;
            moduleAccess.features.forEach(f => f.enabled = false);
        } else {
            moduleAccess.hasAccess = true;
        }
    }

    // ── Feature detail modal ──────────────────────────────────────────────────

    openDetailModal(module: string): void {
        this.currentDetailModule = this.selectedRow?.modules.find(m => m.module === module) ?? null;
        if (this.currentDetailModule) {
            const map = new Map<string, ModuleFeature[]>();
            for (const f of this.currentDetailModule.features) {
                if (!map.has(f.category)) map.set(f.category, []);
                map.get(f.category)!.push(f);
            }
            this.currentDetailGroups = Array.from(map.entries())
                .map(([category, features]) => ({ category, features }));
        } else {
            this.currentDetailGroups = [];
        }
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal    = false;
        this.currentDetailModule = null;
        this.currentDetailGroups = [];
    }

    // ── Save permissions ──────────────────────────────────────────────────────

    savePermissions(): void {
        const row = this.selectedRow;
        if (!row) return;

        const featureKeys = row.modules.flatMap(m => m.features).filter(f => f.enabled).map(f => f.key);
        const moduleCodes = row.modules.filter(m => m.hasAccess).map(m => m.module);

        this.saving = true;
        this.dataSource.updateRoleFeatures(row.role.id, featureKeys, moduleCodes)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.saving = false;
                    this.saved  = true;
                    this.cdr.markForCheck();
                    setTimeout(() => { this.saved = false; this.cdr.markForCheck(); }, 3000);
                },
                error: () => { this.saving = false; this.cdr.markForCheck(); },
            });
    }

    // ── Role modal ────────────────────────────────────────────────────────────

    openCreateRoleModal(): void {
        this.editingRole = null;
        this.roleForm    = { name: '', description: '' };
        this.showRoleModal = true;
    }

    openEditRoleModal(role: RoleSummary, event: Event): void {
        event.stopPropagation();
        this.editingRole = role;
        this.roleForm    = { name: role.name, description: role.description ?? '' };
        this.showRoleModal = true;
    }

    closeRoleModal(): void {
        this.showRoleModal = false;
        this.editingRole   = null;
        this.roleForm      = { name: '', description: '' };
    }

    toggleRoleActive(row: RolePermissionRow, event: Event): void {
        event.stopPropagation();
        const newActive  = !(row.role.is_active ?? true);
        const isGeneric  = row.role.is_generic ?? false;

        this.dataSource.toggleRoleActive(row.role.id, newActive, isGeneric)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: updated => {
                    row.role.is_active = updated.is_active;
                    if (this.selectedRoleId === row.role.id && !row.role.is_active) {
                        const next = this.rolePermissions
                            .find(r => r.role.id !== row.role.id && (r.role.is_active ?? true));
                        this.selectedRoleId = next?.role.id ?? null;
                    }
                    this.cdr.markForCheck();
                },
            });
    }

    saveRole(): void {
        if (!this.roleForm.name.trim()) return;

        const payload: CreateRolePayload = {
            name:        this.roleForm.name,
            description: this.roleForm.description,
        };

        if (this.editingRole) {
            this.dataSource.updateRole(this.editingRole.id, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: updated => {
                        if (this.editingRole) {
                            this.editingRole.name        = updated.name ?? this.editingRole.name;
                            this.editingRole.description = updated.description;
                        }
                        this.closeRoleModal();
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.dataSource.createRole(payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: created => {
                        this.rolePermissions.push({
                            role: { id: created.id, name: created.name, description: created.description, is_active: created.is_active ?? true },
                            modules: this.modules.map(m => ({
                                module:     m.code,
                                moduleName: m.name,
                                moduleIcon: m.icon,
                                hasAccess:  false,
                                features:   this.buildFeatures(m.code),
                            })),
                        });
                        this.selectedRoleId = created.id;
                        this.closeRoleModal();
                        this.cdr.markForCheck();
                    },
                });
        }
    }
}
