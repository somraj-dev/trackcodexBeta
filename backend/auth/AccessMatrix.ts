import { RepoLevel } from '../services/auth/iamService';

// Backend Access Matrix for Granular Permissions
// Matches the hierarchy used in repoAuth middleware

export type RepoPermission =
    | 'PUSH'
    | 'PULL'
    | 'ADMIN'
    | 'MAINTAIN'
    | 'TRIAGE'
    | 'WRITE'
    | 'READ';

export const hasRepoPermission = (userRole: RepoLevel, capability: RepoPermission): boolean => {
    const levels = {
        [RepoLevel.ADMIN]: ['ADMIN', 'MAINTAIN', 'WRITE', 'TRIAGE', 'READ', 'PUSH', 'PULL'],
        [RepoLevel.MAINTAIN]: ['MAINTAIN', 'WRITE', 'TRIAGE', 'READ', 'PUSH', 'PULL'],
        [RepoLevel.WRITE]: ['WRITE', 'TRIAGE', 'READ', 'PUSH', 'PULL'],
        [RepoLevel.TRIAGE]: ['TRIAGE', 'READ', 'PULL'],
        [RepoLevel.READ]: ['READ', 'PULL'],
    };

    const allowed = levels[userRole] || [];
    return allowed.includes(capability);
};

export const isAdmin = (role: string): boolean => {
    return role === 'super_admin' || role === 'org_admin';
};


