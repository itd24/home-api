import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ScanningService {

    url = 'http://host.docker.internal:4356/trigger/scanfile';
    killProcessUrl = "http://host.docker.internal:4356/trigger/killprocess";

    constructor(private readonly httpService: HttpService) { }

    async triggerScan(category: string) {
        const payload = { category };
        try {
            const response = await firstValueFrom(
                this.httpService.post(this.url, payload),
            );
            return response.data;
        } catch (error) {
            console.error('Error triggering scanfile:', error.message);
            throw error;
        }
    }

    async triggerKillNaps() {
        const payload = { processName: "NAPS2.Console" };
        try {
            const response = await firstValueFrom(
                this.httpService.post(this.killProcessUrl, payload),
            );
            return response.data;
        } catch (error) {
            console.error('Error triggering killprocess:', error.message);
            throw error;
        }
    }
}
