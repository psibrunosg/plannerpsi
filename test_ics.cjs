const https = require('https');
https.get('https://outlook.office365.com/owa/calendar/19c38976184d4deabd0dd554b700f5a9@acpo.com.br/2fd104cc4f4a467ab8918ec2f04aa9ca4218618840330036265/calendar.ics', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const events = [];
    let currentEvent = null;
    const lines = data.split(/\r?\n/);
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      while (i + 1 < lines.length && (lines[i+1].startsWith(' ') || lines[i+1].startsWith('\t'))) {
        line += lines[i+1].substring(1);
        i++;
      }
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT') {
        if (currentEvent) events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const keyRaw = line.substring(0, colonIdx);
          const value = line.substring(colonIdx + 1);
          const key = keyRaw.split(';')[0];
          currentEvent[key] = value;
        }
      }
    }
    console.log(`Parsed ${events.length} events`);
    console.log(events.slice(-2));
  });
});
