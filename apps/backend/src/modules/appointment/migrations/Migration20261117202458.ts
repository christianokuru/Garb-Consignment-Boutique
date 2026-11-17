import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261117202458 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "appointment_request" ("id" text not null, "name" text not null, "email" text not null, "phone" text not null, "appointment_type" text check ("appointment_type" in ('in_store', 'in_house')) not null default 'in_store', "item_count" integer not null, "categories" jsonb null, "brands" text null, "preferred_date" timestamptz null, "preferred_time" text null, "notes" text null, "status" text check ("status" in ('new', 'confirmed', 'completed', 'cancelled')) not null default 'new', "confirmed_for" timestamptz null, "staff_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "appointment_request_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_request_deleted_at" ON "appointment_request" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "appointment_request" cascade;`);
  }

}
