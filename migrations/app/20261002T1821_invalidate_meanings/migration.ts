#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/806b38ad7fc82ac0def3b4932c123739136a7636514f8d996c25f11def2af476/contract';
import startContract from '../../snapshots/806b38ad7fc82ac0def3b4932c123739136a7636514f8d996c25f11def2af476/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/8967b09db61ac6072ec112ac038d165c75bd75e493d4a3ede43ca2df85f53e51/contract';
import endContract from '../../snapshots/8967b09db61ac6072ec112ac038d165c75bd75e493d4a3ede43ca2df85f53e51/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'invalidatedMeaning' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'scoreTransaction',
        constraint: 'scoreTransaction_type_check_34d44838',
      }),
      this.addColumn({
        schema: 'public',
        table: 'scoreTransaction',
        column: col('acronymCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'scoreTransaction',
        column: col('meaningText', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dropNotNull({ schema: 'public', table: 'scoreTransaction', column: 'acronymId' }),
      this.dropNotNull({ schema: 'public', table: 'scoreTransaction', column: 'meaningId' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'scoreTransaction',
        constraint: 'scoreTransaction_type_check_2d5357a4',
        expression:
          "\"type\" IN ('NEW_ACRONYM', 'EXISTING_ENTRY', 'DUPLICATE_FOUND', 'INVALIDATED_MEANING')",
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
