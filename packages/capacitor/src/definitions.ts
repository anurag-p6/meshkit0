export interface MeshkitCapacitorPlugin {
  getPlatform(): Promise<{ platform: 'web' | 'ios' | 'android' }>;
}
