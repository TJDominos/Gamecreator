const fs = require('fs');
const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace('@import "react-datepicker/dist/react-datepicker.css";', '');
fs.writeFileSync(cssPath, css, 'utf8');
