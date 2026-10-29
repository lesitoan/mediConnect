import { Module } from "@nestjs/common";
import { MediconnectApiService } from "./mediconnect-api.service.js";

@Module({
  providers: [MediconnectApiService],
  exports: [MediconnectApiService],
})
export class LookupsModule {}
