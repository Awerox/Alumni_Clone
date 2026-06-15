import * as migration_20260521_122659 from './20260521_122659';
import * as migration_20260521_133617 from './20260521_133617';
import * as migration_20260526_133224 from './20260526_133224';
import * as migration_20260610_003253 from './20260610_003253';
import * as migration_20260610_201312 from './20260610_201312';
import * as migration_20260610_202519 from './20260610_202519';
import * as migration_20260611_095817_update_groups_categorie_enum from './20260611_095817_update_groups_categorie_enum';
import * as migration_20260611_group_requests from './20260611_group_requests';
import * as migration_20260612_activity_logs from './20260612_activity_logs';
import * as migration_20260612_locked_docs from './20260612_locked_docs';
import * as migration_20260612_moderateur_action from './20260612_moderateur_action';
import * as migration_20260612_moderateurs from './20260612_moderateurs';
import * as migration_20260612_removed_status from './20260612_removed_status';
import * as migration_20260615_092322 from './20260615_092322';
import * as migration_20260615_094353 from './20260615_094353';
import * as migration_20260615_095024 from './20260615_095024';
import * as migration_20260615_095800 from './20260615_095800';

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
    name: '20260611_095817_update_groups_categorie_enum',
  },
  {
    up: migration_20260611_group_requests.up,
    down: migration_20260611_group_requests.down,
    name: '20260611_group_requests',
  },
  {
    up: migration_20260612_activity_logs.up,
    down: migration_20260612_activity_logs.down,
    name: '20260612_activity_logs',
  },
  {
    up: migration_20260612_locked_docs.up,
    down: migration_20260612_locked_docs.down,
    name: '20260612_locked_docs',
  },
  {
    up: migration_20260612_moderateur_action.up,
    down: migration_20260612_moderateur_action.down,
    name: '20260612_moderateur_action',
  },
  {
    up: migration_20260612_moderateurs.up,
    down: migration_20260612_moderateurs.down,
    name: '20260612_moderateurs',
  },
  {
    up: migration_20260612_removed_status.up,
    down: migration_20260612_removed_status.down,
    name: '20260612_removed_status',
  },
  {
    up: migration_20260615_092322.up,
    down: migration_20260615_092322.down,
    name: '20260615_092322',
  },
  {
    up: migration_20260615_094353.up,
    down: migration_20260615_094353.down,
    name: '20260615_094353',
  },
  {
    up: migration_20260615_095024.up,
    down: migration_20260615_095024.down,
    name: '20260615_095024',
  },
  {
    up: migration_20260615_095800.up,
    down: migration_20260615_095800.down,
    name: '20260615_095800'
  },
];
