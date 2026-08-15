const fs = require('fs');
const path = 'server.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("const puppeteer = require('puppeteer');", "");
content = "import puppeteer from 'puppeteer';\n" + content;

fs.writeFileSync(path, content);
console.log("Fixed require");
