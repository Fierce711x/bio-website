import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '#src/generated/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const env = configService.getOrThrow<string>('NODE_ENV');
    let envString: string;

    if (env === 'test') envString = 'DATABASE_URL_TEST';
    else if (env === 'development') envString = 'DATABASE_URL_DEVELOPMENT';
    else envString = 'DATABASE_URL_PRODUCTION';

    const connectionString = configService.getOrThrow<string>(envString);
    const adapter: PrismaPg = new PrismaPg({ connectionString });
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
    console.log('db ready');
    // const tables = await this.$queryRaw<{ table_name: string }[]>`
    //   SELECT table_name
    //   FROM information_schema.tables
    //   WHERE table_schema = 'public'
    // `;
    // const result = await this.$queryRaw<{ database: string; schema: string }[]>`
    //     SELECT
    //       current_database() AS database,
    //       current_schema() AS schema
    //   `;

    // console.log('DB INFO:', result);

    // console.log('TABLES:', tables);
  }
}
