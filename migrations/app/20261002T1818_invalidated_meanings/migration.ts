#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/806b38ad7fc82ac0def3b4932c123739136a7636514f8d996c25f11def2af476/contract';
import endContract from '../../snapshots/806b38ad7fc82ac0def3b4932c123739136a7636514f8d996c25f11def2af476/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b9451fe36cff4905af757eb575862a653997fe86b92729f714fd839bf78525fc/contract';
import startContract from '../../snapshots/b9451fe36cff4905af757eb575862a653997fe86b92729f714fd839bf78525fc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'invalidatedMeaning',
        columns: [
          col('acronymCode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('invalidatedByUserId', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('normalizedText', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'invalidatedMeaning',
        constraint: 'invalidatedMeaning_acronymCode_normalizedText_key',
        columns: ['acronymCode', 'normalizedText'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'invalidatedMeaning',
        index: 'invalidatedMeaning_invalidatedByUserId_idx_63040bb1',
        columns: ['invalidatedByUserId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'invalidatedMeaning',
        foreignKey: {
          name: 'invalidatedMeaning_invalidatedByUserId_fkey',
          columns: ['invalidatedByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
