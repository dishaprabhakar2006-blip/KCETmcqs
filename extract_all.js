// extract_all.js
import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';

const sourceDir = path.join(process.cwd(), 'pdfs');
const outputDir = path.join(process.cwd(), 'src', 'ncert_text');

async function extractTextFromPdf(pdfPath) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", errData => reject(new Error(errData.parserError)));
        
        pdfParser.on("pdfParser_dataReady", pdfData => {
            const textContent = pdfParser.getRawTextContent();
            resolve(textContent);
        });
        
        pdfParser.loadPDF(pdfPath);
    });
}

async function processAllPdfs() {
    if (!fs.existsSync(sourceDir)) {
        console.error(`Error: 'pdfs' folder not found at ${sourceDir}`);
        return;
    }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfFiles = fs.readdirSync(sourceDir).filter(file => path.extname(file).toLowerCase() === '.pdf');

    if (pdfFiles.length === 0) {
        console.log("No PDF files found in the 'pdfs' folder. Please place your PDFs there.");
        return;
    }

    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(sourceDir, pdfFile);
        
        try {
            const textContent = await extractTextFromPdf(pdfPath);
            
            if (textContent && textContent.trim().length > 0) {
                const outputFileName = `${path.basename(pdfFile, '.pdf')}.txt`;
                const outputPath = path.join(outputDir, outputFileName);
                fs.writeFileSync(outputPath, textContent);
                console.log(`✅ Extracted text from ${pdfFile} and saved to ${outputPath}`);
            } else {
                 console.log(`⚠️ Skipping empty file: ${pdfFile}`);
            }
        } catch (error) {
            console.error(`❌ Could not process ${pdfFile}: ${error.message}`);
        }
    }
    console.log("🎉 All PDFs processed!");
}

processAllPdfs();