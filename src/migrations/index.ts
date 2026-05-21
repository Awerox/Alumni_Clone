import * as migration_20260521_122659 from './20260521_122659';
import * as migration_20260521_133617 from './20260521_133617';

export const migrations = [
  {
    up: migration_20260521_122659.up,
    down: migration_20260521_122659.down,
    name: '20260521_122659',
  },
  {
    up: migration_20260521_133617.up,
    down: migration_20260521_133617.down,
    name: '20260521_133617'
  },
];
