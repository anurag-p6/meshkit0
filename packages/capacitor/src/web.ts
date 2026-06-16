import { WebPlugin } from '@capacitor/core';
import type { MeshkitCapacitorPlugin } from './definitions.js';

export class MeshkitCapacitorWeb extends WebPlugin implements MeshkitCapacitorPlugin {
  async getPlatform(): Promise<{ platform: 'web' | 'ios' | 'android' }> {
    return { platform: 'web' };
  }
}
