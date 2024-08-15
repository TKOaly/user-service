import { Knex } from "knex";

import path from "path";
import fs from "fs/promises";
import { sortBy } from "lodash";

class FileInfo {
  constructor(
    public directory: string,
    public file: string,
  ) {}

  public toString() {
    return this.file;
  }
}

async function readFiles(dirs: string[], extensions: readonly string[]): Promise<FileInfo[]> {
  const files = await Promise.all(
    dirs.map(async (directory: string) => {
      const absoluteDir = path.resolve(process.cwd(), directory);
      const files = await fs.readdir(absoluteDir);

      return files.map(file => new FileInfo(directory, file));
    }),
  );

  const matching = files.flat().filter(({ file }) => extensions.includes(path.extname(file)));

  return sortBy(matching, "file");
}

export class EsmFsSeedSource implements Knex.SeedSource<FileInfo> {
  extensions = [".ts", ".js"];

  async getSeeds(config: Knex.SeederConfig<any>): Promise<FileInfo[]> {
    const dirs: string[] = [config.directory ?? "seed"].flat();
    return readFiles(dirs, this.extensions);
  }

  getSeed(seed: FileInfo): Promise<Knex.Seed> {
    const absoluteDir = path.resolve(process.cwd(), seed.directory);
    const _path = path.join(absoluteDir, seed.file);
    return import(_path);
  }
}

export class EsmFsMigrationSource implements Knex.MigrationSource<FileInfo> {
  constructor(private migrationsPaths: string[] = ["migrations"]) {}

  async getMigrations(loadExtensions: readonly string[]): Promise<FileInfo[]> {
    return readFiles(this.migrationsPaths, loadExtensions);
  }

  getMigrationName(migration: FileInfo): string {
    return migration.file;
  }

  async getMigration(migration: FileInfo): Promise<Knex.Migration> {
    const absoluteDir = path.resolve(process.cwd(), migration.directory);
    const migrationPath = path.join(absoluteDir, migration.file);
    return import(migrationPath);
  }
}
