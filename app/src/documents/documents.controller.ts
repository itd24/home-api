import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ScanningService } from './scanning.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtOrApikeyAuthGuard } from '@auth/jwt-or-apikey-auth.guard';

@Controller('documents')
@ApiTags('documents')
export class DocumentsController {
      constructor(private readonly scanningService: ScanningService) {}

        @Get('scan/:category')
        @ApiBearerAuth()
        @UseGuards(JwtOrApikeyAuthGuard)
        TriggerScanning(@Param('category') category: string) {
          return this.scanningService.triggerScan(category);
        }
        @Get('killnaps')
        @ApiBearerAuth()
        @UseGuards(JwtOrApikeyAuthGuard)
        TriggerNapsKill() {
          return this.scanningService.triggerKillNaps();
        }
}
