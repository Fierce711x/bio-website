import { JwtSharedModule } from '#src/modules/sharedJwtModule/jwtShared.module.js';
import { UserModule } from '#src/modules/userModule/user.module.js';
import { Module } from '@nestjs/common';
import { AppGateway } from './webSocket.gateway.js';
import { ConnectionsStorage } from './connectionsStroage.service.js';

@Module({
  imports: [UserModule, JwtSharedModule],
  providers: [AppGateway, ConnectionsStorage],
  exports: [ConnectionsStorage],
})
export class GateWay {}
