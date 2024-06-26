import { HttpService } from '@nestjs/axios';
import { Connection } from '../common/model/connection.model';
import { CookiesPVE } from '../common/model/cookie-pve.model';
import { firstValueFrom } from 'rxjs';
import { ConfigVMException } from './exception/vm-error-config.exception';
import { AuthFailedException } from '../common/exception/auth-failed.exception';
import { HostUnreachableException } from '../common/exception/host-unreachable.exception';

export class ConfigVMinNodeService {
  constructor(
    private httpService: HttpService,
    private connection: Connection,
    private cookiesPVE: CookiesPVE,
  ) {}

  async configVM(
    node: string,
    vmid: number,
    index?: number,
    discard?: string,
    cache?: string,
    importFrom?: string,
  ): Promise<string | null> {
    try {
      const body = {
        [`scsi${index}`]: `discard=${discard}`,
        [`scsi${index}`]: `file=local-lvm:vm-102-disk-0,size=32`,
        [`scsi${index}`]: `cache=${cache}`,
        [`scsi${index}`]: `import-from=${importFrom}`,
      };

      const result = await firstValueFrom(
        this.httpService.post(
          `${this.connection.getUri()}/nodes/${node}/qemu/${vmid}/config`,
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Cookie: await this.cookiesPVE.getCookiesAsString(
                this.connection.getUri(),
              ),
            },
          },
        ),
      );

      if (!result.data) {
        throw new ConfigVMException();
      }

      return result.data;
    } catch (error) {
      if (error.response.status === 401) {
        throw new AuthFailedException();
      }
      if (error.response.status === 0) {
        throw new HostUnreachableException();
      }
    }

    return null;
  }
}
