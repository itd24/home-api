import { Injectable } from '@nestjs/common';
import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class LatexService {

    async renderLatex(latex: string, tmpFolder: string): Promise<Buffer> {
        const texPath = path.join(tmpFolder, 'document.tex');
        const pdfPath = path.join(tmpFolder, 'document.pdf');

        await this.copyAltacv(tmpFolder);
        await this.copySignature(tmpFolder);
    
        try {
          // Write LaTeX file
          await fs.writeFile(texPath, latex);
          // Run LaTeX
          await this.runLatex(tmpFolder);

          // Read PDF
          const pdfBuffer = await fs.readFile(pdfPath);
    
          return pdfBuffer;
        } finally {
            
        }
      }

      async downloadImage(imageUrl, tmpFolder, imageName) {
        const filePath = path.join(tmpFolder, imageName);
              
        // Check if file exists and delete it
        try {
          await fs.access(filePath);
          await fs.unlink(filePath);
        } catch (err) {
          // file doesn't exist → ignore
        }
      
        // Download image
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer',
        });
      
        await fs.writeFile(filePath, response.data);

        const fileName = path.basename(filePath);
        // Return path for LaTeX
        return {filePath, fileName};
      }
    
      private runLatex(cwd: string): Promise<void> {
        return new Promise((resolve, reject) => {
          execFile(
            'latexmk',
            ['-f', '-interaction=nonstopmode', '-pdfxe', 'document.tex'],
            { cwd },
            (error, stdout, stderr) => {
              // latexmk exits 1 due to rerun warnings even when the PDF
              // is successfully produced — check the file, not the exit code
              const pdfExists = existsSync(path.join(cwd, 'document.pdf'));

              if (pdfExists) {
                return resolve();
              }
              console.error(stdout);
              console.error(stderr);
              return reject(error ?? new Error('PDF was not generated'));
            }
          );
        });
      }

      private async copyAltacv(tmpDir: string) {
        const source = '/storage/altacv/altacv.cls';
        const destination = path.join(tmpDir, 'altacv.cls');
      
        await fs.copyFile(source, destination);
      }

      private async copySignature(tmpDir: string){
        const source = '/storage/signature.png';
        const destination = path.join(tmpDir, 'signature.png');
      
        await fs.copyFile(source, destination);       
      }
}
