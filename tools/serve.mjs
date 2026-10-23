import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2] || '.'),port=Number(process.argv[3] || 4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  try {const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}const stat=fs.statSync(file);if(!stat.isFile())throw new Error();res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Lecture preview: http://127.0.0.1:${port}`));
