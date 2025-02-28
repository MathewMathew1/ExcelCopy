export class LockdownManager {
    private static applied = false;
  
    static applyLockdown() {
      if (!this.applied) {

        this.applied = true;
      }
    }
  
    static isLockdownApplied(): boolean {
      return this.applied;
    }
  }
  