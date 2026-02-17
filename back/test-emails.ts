import fs from 'fs';
import path from 'path';
import hbs from 'handlebars';

const templates = ['order-confirmation', 'reset-password', 'order-shipped'];
const mockData = {
  name: 'Leandro Fusco',
  order_id: '12345',
  date: '07 de Febrero, 2026',
  total: '1599.00',
  year: 2026,
  reset_link: 'http://localhost:3010/reset-password?token=abc',
  tracking_number: 'AR-987654321',
  items: [
    { name: 'iPhone 15 Pro Max - Titanio', quantity: 1, price: '1199.00' },
    { name: 'Libre Eau de Parfum 90ml', quantity: 1, price: '400.00' }
  ]
};

const previewDir = path.join(__dirname, 'preview');
if (!fs.existsSync(previewDir)) fs.mkdirSync(previewDir);

templates.forEach(name => {
  const templatePath = path.join(__dirname, 'email-templates', `${name}.hbs`);
  if (fs.existsSync(templatePath)) {
    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = hbs.compile(source);
    const html = template(mockData);
    fs.writeFileSync(path.join(previewDir, `${name}-preview.html`), html);
    console.log(`✅ Previsualización generada: back/preview/${name}-preview.html`);
  }
});
