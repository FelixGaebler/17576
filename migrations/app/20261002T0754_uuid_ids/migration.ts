#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/197ed6994fec40dc71fc7b78286b767a941d98968c09f8eccf0ea613449b3bc5/contract';
import startContract from '../../snapshots/197ed6994fec40dc71fc7b78286b767a941d98968c09f8eccf0ea613449b3bc5/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b9451fe36cff4905af757eb575862a653997fe86b92729f714fd839bf78525fc/contract';
import endContract from '../../snapshots/b9451fe36cff4905af757eb575862a653997fe86b92729f714fd839bf78525fc/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

// Existing rows get random UUIDs; the temporary id map rewrites every foreign key to match.
const referencedTables = ['user', 'acronym', 'meaning'] as const;

const foreignKeys = [
  { table: 'acronym', column: 'createdByUserId', references: 'user' },
  { table: 'meaning', column: 'acronymId', references: 'acronym' },
  { table: 'meaning', column: 'createdByUserId', references: 'user' },
  { table: 'scoreTransaction', column: 'userId', references: 'user' },
  { table: 'scoreTransaction', column: 'acronymId', references: 'acronym' },
  { table: 'scoreTransaction', column: 'meaningId', references: 'meaning' },
] as const;

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'acronym', column: 'id' }),
      this.dropDefault({ schema: 'public', table: 'meaning', column: 'id' }),
      this.dropDefault({ schema: 'public', table: 'scoreTransaction', column: 'id' }),
      this.dropDefault({ schema: 'public', table: 'user', column: 'id' }),
      ...foreignKeys.map(({ table, column }) =>
        this.dropConstraint({ schema: 'public', table, constraint: `${table}_${column}_fkey`, kind: 'foreignKey' }),
      ),
      rawSql({
        id: 'data_migration.uuid-id-map',
        label: 'Assign a random UUID to every existing user, acronym and meaning',
        operationClass: 'data',
        target: { id: 'postgres', details: { schema: 'pg_temp', objectType: 'table', name: 'id_map' } },
        precheck: [],
        execute: [
          {
            description: 'create temporary id map',
            sql: 'CREATE TEMPORARY TABLE "id_map" ("table" text NOT NULL, "oldId" int4 NOT NULL, "newId" uuid NOT NULL DEFAULT gen_random_uuid(), PRIMARY KEY ("table", "oldId"))',
          },
          ...referencedTables.map((table) => ({
            description: `map ${table} ids`,
            sql: `INSERT INTO pg_temp."id_map" ("table", "oldId") SELECT '${table}', "id" FROM "public"."${table}"`,
          })),
          {
            description: 'create id lookup function',
            sql: 'CREATE FUNCTION pg_temp."new_id"(text, int4) RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT "newId" FROM pg_temp."id_map" WHERE "table" = $1 AND "oldId" = $2 $$',
          },
        ],
        postcheck: [],
      }),
      ...referencedTables.map((table) => this.toUuid(table, 'id', `pg_temp."new_id"('${table}', "id")`)),
      this.toUuid('scoreTransaction', 'id', 'gen_random_uuid()'),
      ...foreignKeys.map(({ table, column, references }) =>
        this.toUuid(table, column, `pg_temp."new_id"('${references}', "${column}")`),
      ),
      rawSql({
        id: 'data_migration.uuid-id-map-cleanup',
        label: 'Drop the temporary id map and the old id sequences',
        operationClass: 'destructive',
        target: { id: 'postgres', details: { schema: 'pg_temp', objectType: 'table', name: 'id_map' } },
        precheck: [],
        execute: [
          { description: 'drop id lookup function', sql: 'DROP FUNCTION pg_temp."new_id"(text, int4)' },
          { description: 'drop temporary id map', sql: 'DROP TABLE pg_temp."id_map"' },
          ...[...referencedTables, 'scoreTransaction'].map((table) => ({
            description: `drop ${table} id sequence`,
            sql: `DROP SEQUENCE IF EXISTS "public"."${table}_id_seq"`,
          })),
        ],
        postcheck: [],
      }),
      ...foreignKeys.map(({ table, column, references }) =>
        this.addForeignKey({
          schema: 'public',
          table,
          foreignKey: {
            name: `${table}_${column}_fkey`,
            columns: [column],
            references: { schema: 'public', table: references, columns: ['id'] },
          },
        }),
      ),
    ];
  }

  private toUuid(table: string, column: string, using: string) {
    return this.alterColumnType({
      schema: 'public',
      table,
      column,
      options: {
        qualifiedTargetType: 'uuid',
        formatTypeExpected: 'uuid',
        rawTargetTypeForLabel: 'uuid',
        using,
      },
    });
  }
}

MigrationCLI.run(import.meta.url, M);
