import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261117202451 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "designer" drop constraint if exists "designer_handle_unique";`);
    this.addSql(`create table if not exists "designer" ("id" text not null, "name" text not null, "handle" text not null, "description" text null, "is_featured" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "designer_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_designer_handle_unique" ON "designer" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_designer_deleted_at" ON "designer" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "designer" cascade;`);
  }

}
