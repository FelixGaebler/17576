#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/197ed6994fec40dc71fc7b78286b767a941d98968c09f8eccf0ea613449b3bc5/contract';
import endContract from '../../snapshots/197ed6994fec40dc71fc7b78286b767a941d98968c09f8eccf0ea613449b3bc5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cca0ba04d7fca33f67d5f0443a2fe0cb49a3f02e5da2582f7d000221caac53ae/contract';
import startContract from '../../snapshots/cca0ba04d7fca33f67d5f0443a2fe0cb49a3f02e5da2582f7d000221caac53ae/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'scoreTransaction',
        constraint: 'scoreTransaction_userId_acronymId_key',
      }),
      this.addUnique({
        schema: 'public',
        table: 'scoreTransaction',
        constraint: 'scoreTransaction_userId_meaningId_key',
        columns: ['userId', 'meaningId'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
