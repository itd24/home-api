import { Body, Res, Controller, Post, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LatexService } from './latex.service';
import { ApiBearerAuth, ApiTags, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { JwtOrApikeyAuthGuard } from '@auth/jwt-or-apikey-auth.guard';
import { RenderLatexDto } from './dto/RenderLatexDto';
import * as tmp from 'tmp';

@Controller('latex')
export class LatexController {
  constructor(private readonly latexService: LatexService) {}

    @Post('render')
    @ApiProduces('application/pdf')
    @ApiResponse({
      status: 200,
      description: 'Generated PDF',
      schema: {
        type: 'string',
        format: 'binary',
      },
    })
    @ApiTags('LaTeX')
    @ApiBearerAuth()
    @UseGuards(JwtOrApikeyAuthGuard)
    async render(@Body() contentDto: RenderLatexDto, @Res() res: Response) {

      const { template, imageUrl } = contentDto;

      const tmpDir = tmp.dirSync({ unsafeCleanup: true });
      const tmpFolder = tmpDir.name;

      let finalTemplate = template;
      if (imageUrl) {
        const {filePath, fileName} = await this.latexService.downloadImage(
          imageUrl,
          tmpFolder,
          'profile.jpg',
        );
       
        finalTemplate = template.replace(
          '{PROFILE_IMAGE}',
          fileName,
        );
      }

      const pdf = await this.latexService.renderLatex(finalTemplate, tmpFolder);

      tmpDir.removeCallback();
  
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="output.pdf"',
      });
  
      res.send(pdf);
    }  
}
