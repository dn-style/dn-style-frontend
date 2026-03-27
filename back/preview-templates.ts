import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';

const templatesDir = path.join(__dirname, 'email-templates');
const outputDir = path.join(__dirname, 'previews_output');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const testData = {
    name: "Jose Perez",
    order_id: "998877",
    total: "1550.00",
    items: [
        { name: "iPhone 15 Pro Max 256GB - Titanium", quantity: 1, price: "1300.00" },
        { name: "Funda Silicona MagSafe - Azul", quantity: 1, price: "250.00" }
    ],
    year: new Date().getFullYear(),
    tracking_number: "AR-123456789-DN",
    tracking_url: "https://dnshop.com.ar/tracking/AR-123456789-DN",
    reset_link: "https://dnshop.com.ar/reset-password?token=preview-token",
    verify_link: "https://dnshop.com.ar/verify?token=welcome-token"
};

const templates = [
    'order-confirmation',
    'order-preparing',
    'order-shipped',
    'order-cancelled',
    'reset-password',
    'verify-email'
];

console.log(' Generando previsualizaciones de plantillas...');

templates.forEach(templateName => {
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);

    if (fs.existsSync(templatePath)) {
        const source = fs.readFileSync(templatePath, 'utf8');
        const template = hbs.compile(source);
        const html = template(testData);

        const outputPath = path.join(outputDir, `${templateName}.html`);
        fs.writeFileSync(outputPath, html);
        console.log(` Generado: ${outputPath}`);
    } else {
        console.log(`  No se encontr la plantilla: ${templateName}.hbs`);
    }
});

console.log('\n Proceso terminado. Abre los archivos en la carpeta "back/previews_output" para ver los resultados.');
