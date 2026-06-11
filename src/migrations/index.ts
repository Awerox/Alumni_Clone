import * as migration_20260521_122659 from './20260521_122659';
import * as migration_20260521_133617 from './20260521_133617';
import * as migration_20260526_133224 from './20260526_133224';
import * as migration_20260610_003253 from './20260610_003253';
import * as migration_20260610_201312 from './20260610_201312';
import * as migration_20260610_202519 from './20260610_202519';
import * as migration_20260611_095817_update_groups_categorie_enum from './20260611_095817_update_groups_categorie_enum';

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
    name: '20260610_003253',
  },
  {
    up: migration_20260610_201312.up,
    down: migration_20260610_201312.down,
    name: '20260610_201312',
  },
  {
    up: migration_20260610_202519.up,
    down: migration_20260610_202519.down,
    name: '20260610_202519',
  },
  {
    up: migration_20260611_095817_update_groups_categorie_enum.up,
    down: migration_20260611_095817_update_groups_categorie_enum.down,
    name: '20260611_095817_update_groups_categorie_enum'
  },
];
