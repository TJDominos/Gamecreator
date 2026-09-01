const fs = require('fs');
const path = 'src/developer-portal/DeveloperPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import DatePicker from "react-datepicker";\nimport { format, parseISO } from "date-fns";\n/, '');

content = content.replace(
  /const \[startDate, setStartDate\] = useState<Date \| null>\(new Date\("2026-07-24"\)\);/,
  'const [startDate, setStartDate] = useState("2026-07-24");'
);
content = content.replace(
  /const \[endDate, setEndDate\] = useState<Date \| null>\(new Date\("2026-08-23"\)\);/,
  'const [endDate, setEndDate] = useState("2026-08-23");'
);

const oldInputs = /<DatePicker[\s\S]*?className="custom-datepicker"\s*\/>\s*<span style=\{\{ color: 'var\(--portal-muted\)' \}\}>→<\/span>\s*<DatePicker[\s\S]*?className="custom-datepicker"\s*\/>/;

const newInputs = `<div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px' }}>{startDate}</span>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="portal-date-hidden-input"
                />
              </div>
              <span style={{ color: 'var(--portal-muted)' }}>→</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px' }}>{endDate}</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="portal-date-hidden-input"
                />
              </div>`;

content = content.replace(oldInputs, newInputs);

fs.writeFileSync(path, content, 'utf8');

const cssPath = 'src/developer-portal/DeveloperPortal.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace('@import "react-datepicker/dist/react-datepicker.css";\n', '');

const cssRuleToRemove = /\.custom-datepicker\s*\{[^}]*\}\s*\.react-datepicker-wrapper\s*\{[^}]*\}\s*\.react-datepicker-popper\s*\{[^}]*\}\s*\.react-datepicker\s*\{[^}]*\}\s*\.react-datepicker__header\s*\{[^}]*\}\s*\.react-datepicker__day--selected[^}]*\}\s*\.react-datepicker__day--keyboard-selected[^}]*\}/;
// Note: regex removal for multiple blocks is tricky, I'll just remove the react-datepicker stuff using a simpler replace or substring.
