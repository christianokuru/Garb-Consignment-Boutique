import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261117202455 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "consignor" drop constraint if exists "consignor_email_unique";`);
    this.addSql(`alter table if exists "consignor" drop constraint if exists "consignor_account_number_unique";`);
    this.addSql(`create table if not exists "consignor" ("id" text not null, "account_number" text not null, "first_name" text not null, "last_name" text not null, "email" text not null, "phone" text null, "split_rate" integer not null default 50, "notes" text null, "has_account" boolean not null default false, "invite_token_hash" text null, "invite_expires_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "consignor_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_consignor_account_number_unique" ON "consignor" ("account_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_consignor_email_unique" ON "consignor" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignor_deleted_at" ON "consignor" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "consignor_payout" ("id" text not null, "period" text not null, "amount" numeric not null, "item_count" integer not null default 0, "status" text check ("status" in ('scheduled', 'paid')) not null default 'scheduled', "available_at" timestamptz not null, "paid_at" timestamptz null, "method" text null, "note" text null, "consignor_id" text not null, "raw_amount" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "consignor_payout_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignor_payout_consignor_id" ON "consignor_payout" ("consignor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignor_payout_deleted_at" ON "consignor_payout" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "consignment_item" ("id" text not null, "item_code" text not null, "title" text not null, "status" text check ("status" in ('active', 'sold', 'expired', 'returned', 'forfeited', 'withdrawn')) not null default 'active', "received_at" timestamptz not null, "display_days" integer not null default 90, "expires_at" timestamptz not null, "list_price" numeric not null, "sale_price" numeric null, "consignor_share" numeric null, "sold_at" timestamptz null, "order_id" text null, "pickup_deadline" timestamptz null, "consignor_id" text not null, "payout_id" text null, "raw_list_price" jsonb not null, "raw_sale_price" jsonb null, "raw_consignor_share" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "consignment_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignment_item_consignor_id" ON "consignment_item" ("consignor_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignment_item_payout_id" ON "consignment_item" ("payout_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_consignment_item_deleted_at" ON "consignment_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "consignor_payout" add constraint "consignor_payout_consignor_id_foreign" foreign key ("consignor_id") references "consignor" ("id") on update cascade;`);

    this.addSql(`alter table if exists "consignment_item" add constraint "consignment_item_consignor_id_foreign" foreign key ("consignor_id") references "consignor" ("id") on update cascade;`);
    this.addSql(`alter table if exists "consignment_item" add constraint "consignment_item_payout_id_foreign" foreign key ("payout_id") references "consignor_payout" ("id") on update cascade on delete set null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "consignor_payout" drop constraint if exists "consignor_payout_consignor_id_foreign";`);

    this.addSql(`alter table if exists "consignment_item" drop constraint if exists "consignment_item_consignor_id_foreign";`);

    this.addSql(`alter table if exists "consignment_item" drop constraint if exists "consignment_item_payout_id_foreign";`);

    this.addSql(`drop table if exists "consignor" cascade;`);

    this.addSql(`drop table if exists "consignor_payout" cascade;`);

    this.addSql(`drop table if exists "consignment_item" cascade;`);
  }

}
