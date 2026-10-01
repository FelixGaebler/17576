#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/a8c2b44a66375905c448d355506c489aba8f8920c398bd3c95adb4fed318e32b/contract';
import startContract from '../../snapshots/a8c2b44a66375905c448d355506c489aba8f8920c398bd3c95adb4fed318e32b/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cca0ba04d7fca33f67d5f0443a2fe0cb49a3f02e5da2582f7d000221caac53ae/contract';
import endContract from '../../snapshots/cca0ba04d7fca33f67d5f0443a2fe0cb49a3f02e5da2582f7d000221caac53ae/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';
import postgres from '@prisma/orm-postgres/runtime';
import 'temporal-polyfill/global';

const db = postgres<End>({ contractJson: endContract });

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropTable({ schema: 'public', table: 'post' }),
      this.dropColumn({ schema: 'public', table: 'user', column: 'name' }),
      this.dropConstraint({ schema: 'public', table: 'user', constraint: 'user_username_key' }),
      this.dropColumn({ schema: 'public', table: 'user', column: 'username' }),
      this.createTable({
        schema: 'public',
        table: 'acronym',
        columns: [
          col('code', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdByUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('acronym_code_format_e2023756', "code ~ '^[A-Z]{3}$'"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'meaning',
        columns: [
          col('acronymId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('createdByUserId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('normalizedText', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('text', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'scoreTransaction',
        columns: [
          col('acronymId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('meaningId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('userId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'scoreTransaction_type_check_34d44838',
            "\"type\" IN ('NEW_ACRONYM', 'EXISTING_ENTRY', 'DUPLICATE_FOUND')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('avatarUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('score', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('displayName', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(db.contract, 'backfill-user-displayName', {
        check: () =>
          db.sql.public.user
            .select('id')
            .where((f, fns) => fns.eq(f.displayName, null))
            .limit(1),
        run: () =>
          db.sql.public.user
            .update((f, fns) => ({
              displayName: fns.raw`split_part(${f.email}, '@', 1)`.returns('pg/text@1'),
            }))
            .where((f, fns) => fns.eq(f.displayName, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'displayName' }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('externalId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.dataTransform(db.contract, 'backfill-user-externalId', {
        check: () =>
          db.sql.public.user
            .select('id')
            .where((f, fns) => fns.eq(f.externalId, null))
            .limit(1),
        run: () =>
          db.sql.public.user
            .update((f, fns) => ({
              externalId: fns.raw`'legacy-' || ${f.id}`.returns('pg/text@1'),
            }))
            .where((f, fns) => fns.eq(f.externalId, null)),
      }),
      this.setNotNull({ schema: 'public', table: 'user', column: 'externalId' }),
      this.addUnique({
        schema: 'public',
        table: 'acronym',
        constraint: 'acronym_code_key',
        columns: ['code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'meaning',
        constraint: 'meaning_acronymId_normalizedText_key',
        columns: ['acronymId', 'normalizedText'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'scoreTransaction',
        constraint: 'scoreTransaction_userId_acronymId_key',
        columns: ['userId', 'acronymId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_externalId_key',
        columns: ['externalId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'acronym',
        index: 'acronym_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meaning',
        index: 'meaning_acronymId_idx_cef5a734',
        columns: ['acronymId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'meaning',
        index: 'meaning_createdByUserId_idx_93e8a540',
        columns: ['createdByUserId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'scoreTransaction',
        index: 'scoreTransaction_acronymId_idx_cef5a734',
        columns: ['acronymId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'scoreTransaction',
        index: 'scoreTransaction_meaningId_idx_0b1880e1',
        columns: ['meaningId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'scoreTransaction',
        index: 'scoreTransaction_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'acronym',
        foreignKey: {
          name: 'acronym_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meaning',
        foreignKey: {
          name: 'meaning_acronymId_fkey',
          columns: ['acronymId'],
          references: { schema: 'public', table: 'acronym', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'meaning',
        foreignKey: {
          name: 'meaning_createdByUserId_fkey',
          columns: ['createdByUserId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'scoreTransaction',
        foreignKey: {
          name: 'scoreTransaction_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'scoreTransaction',
        foreignKey: {
          name: 'scoreTransaction_acronymId_fkey',
          columns: ['acronymId'],
          references: { schema: 'public', table: 'acronym', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'scoreTransaction',
        foreignKey: {
          name: 'scoreTransaction_meaningId_fkey',
          columns: ['meaningId'],
          references: { schema: 'public', table: 'meaning', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
