import * as migration_20260521_122659 from './20260521_122659';
import * as migration_20260521_133617 from './20260521_133617';
import * as migration_20260526_133224 from './20260526_133224';
import * as migration_20260610_003253 from './20260610_003253';

export const migrations = [
  {
    up: migration_20260521_122659.up,
    down: migration_20260521_122659.down,
    name: '20260521_122659',
  },
  {
    up: migration_20260521_133617.up,
    down: migration_20260521_133617.down,
    name: '20260521_133617',
  },
  {
    up: migration_20260526_133224.up,
    down: migration_20260526_133224.down,
    name: '20260526_133224',
  },
  {
    up: migration_20260610_003253.up,
    down: migration_20260610_003253.down,
    name: '20260610_003253'
  },
];
