// server.js - シンプルなローカルHTTPサーバー（CORS対応）

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIMEタイプの定義
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// APIプロキシ処理関数
function handleApiProxy(req, res, requestPath) {
    const https = require('https');
    const querystring = require('querystring');
    
    console.log(`🔄 APIプロキシリクエスト: ${req.method} ${req.url}`);
    
    // プロキシ対象のAPI URL
    const API_BASE = 'https://aablnq3wnk.execute-api.ap-northeast-1.amazonaws.com/report-v2t-dev';
    
    // URLを解析してクエリパラメータを取得
    const urlParts = req.url.split('?');
    const queryParams = urlParts[1] || '';
    const targetUrl = API_BASE + (queryParams ? '?' + queryParams : '');
    
    console.log(`🎯 プロキシ先URL: ${targetUrl}`);
    
    const options = {
        method: req.method,
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Bookmarklet-Proxy/1.0)',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
        }
    };
    
    const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        console.log(`📡 API応答: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
        
        // CORSヘッダーを設定
        setCORSHeaders(res);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        
        // ステータスコードを設定
        res.writeHead(proxyRes.statusCode);
        
        // レスポンスデータを収集
        let responseData = '';
        proxyRes.on('data', (chunk) => {
            responseData += chunk;
        });
        
        proxyRes.on('end', () => {
            console.log(`📦 レスポンスデータ: ${responseData.substring(0, 200)}...`);
            res.end(responseData);
        });
    });
    
    proxyReq.on('error', (error) => {
        console.error('❌ プロキシエラー:', error.message);
        setCORSHeaders(res);
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ 
            error: 'Proxy Error', 
            message: error.message,
            timestamp: new Date().toISOString(),
            targetUrl: targetUrl
        }));
    });
    
    proxyReq.on('timeout', () => {
        console.error('⏰ プロキシタイムアウト');
        setCORSHeaders(res);
        res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
            error: 'Gateway Timeout',
            message: 'APIリクエストがタイムアウトしました',
            timestamp: new Date().toISOString()
        }));
    });
    
    // タイムアウトを設定
    proxyReq.setTimeout(30000);
    
    // リクエスト送信
    proxyReq.end();
}

// CORSヘッダーを設定する関数
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24時間
}

// ファイルを読み込んで送信する関数
function serveFile(filePath, res) {
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // 404 Not Found
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html lang="ja">
                    <head>
                        <meta charset="UTF-8">
                        <title>404 - ファイルが見つかりません</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                            h1 { color: #e74c3c; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - ファイルが見つかりません</h1>
                        <p>要求されたファイル「${filePath}」が見つかりませんでした。</p>
                        <a href="/">トップページに戻る</a>
                    </body>
                    </html>
                `);
            } else {
                // 500 Internal Server Error
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('サーバーエラー: ' + error.code);
            }
        } else {
            // ファイル拡張子からMIMEタイプを取得
            const extname = String(path.extname(filePath)).toLowerCase();
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// ディレクトリ一覧を表示する関数
function serveDirectory(dirPath, requestPath, res) {
    fs.readdir(dirPath, { withFileTypes: true }, (error, files) => {
        if (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('ディレクトリを読み込めませんでした: ' + error.message);
            return;
        }

        const fileList = files.map(file => {
            const fileName = file.name;
            const isDirectory = file.isDirectory();
            const icon = isDirectory ? '📁' : '📄';
            const href = path.join(requestPath, fileName).replace(/\\/g, '/');
            
            return `<li><a href="${href}">${icon} ${fileName}${isDirectory ? '/' : ''}</a></li>`;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>ディレクトリ一覧 - ${requestPath}</title>
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        max-width: 800px; 
                        margin: 0 auto; 
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 30px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { 
                        color: #333; 
                        border-bottom: 2px solid #007bff;
                        padding-bottom: 10px;
                    }
                    ul { 
                        list-style: none; 
                        padding: 0; 
                    }
                    li { 
                        margin: 8px 0;
                        padding: 8px;
                        border-radius: 4px;
                        transition: background-color 0.2s;
                    }
                    li:hover {
                        background-color: #f8f9fa;
                    }
                    a { 
                        text-decoration: none; 
                        color: #007bff;
                        font-size: 16px;
                    }
                    a:hover { 
                        text-decoration: underline; 
                    }
                    .info {
                        background-color: #e7f3ff;
                        border: 1px solid #b3d9ff;
                        padding: 15px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .back-link {
                        display: inline-block;
                        margin-bottom: 20px;
                        color: #6c757d;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="info">
                        💡 <strong>Bookmarkletテスト用ローカルサーバー</strong><br>
                        CORS問題を回避するため、<code>file://</code>ではなく<code>http://localhost</code>でアクセスしています。
                    </div>
                    ${requestPath !== '/' ? '<a href="../" class="back-link">⬆️ 上のディレクトリに戻る</a>' : ''}
                    <h1>📁 ディレクトリ一覧: ${requestPath}</h1>
                    <ul>
                        ${fileList}
                    </ul>
                </div>
            </body>
            </html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
    });
}

// サーバー作成
const server = http.createServer((req, res) => {
    // CORSヘッダーを設定
    setCORSHeaders(res);
    
    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // URLを解析
    const parsedUrl = url.parse(req.url, true);
    let requestPath = parsedUrl.pathname;
    
    // パスの正規化
    requestPath = path.normalize(requestPath);
    
    // セキュリティ: ../ を使った上位ディレクトリへのアクセスを防ぐ
    if (requestPath.includes('..')) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden: 不正なパスです');
        return;
    }

    // プロキシ機能を追加
    if (requestPath.startsWith('/api/')) {
        // APIプロキシの処理
        handleApiProxy(req, res, requestPath);
        return;
    }
    
    // ルートパスの場合はindex.htmlを探す
    if (requestPath === '/' || requestPath === '') {
        const indexPath = path.join(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
            filePath = indexPath;
        }
    }

    // ファイル/ディレクトリの存在確認
    fs.stat(filePath, (error, stats) => {
        if (error) {
            // ファイルが存在しない
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        if (stats.isDirectory()) {
            // ディレクトリの場合、index.htmlがあるかチェック
            const indexFile = path.join(filePath, 'index.html');
            if (fs.existsSync(indexFile)) {
                serveFile(indexFile, res);
            } else {
                // index.htmlがない場合はディレクトリ一覧を表示
                serveDirectory(filePath, requestPath, res);
            }
        } else {
            // ファイルの場合はそのまま送信
            serveFile(filePath, res);
        }
    });
});

// ポート設定
const PORT = process.env.PORT || 8000;

// サーバー起動
server.listen(PORT, 'localhost', () => {
    console.log('🚀 ローカルサーバーが起動しました！');
    console.log('================================');
    console.log(`📡 URL: http://localhost:${PORT}`); 
    console.log(`📂 ルートディレクトリ: ${process.cwd()}`);
    console.log('================================');
    console.log('💡 使用方法:');
    console.log(`   1. ブラウザで http://localhost:${PORT} にアクセス`);
    console.log('   2. index.html をクリックして開く');
    console.log('   3. Bookmarkletをテストする');
    console.log('');
    console.log('⚠️  サーバーを停止するには Ctrl+C を押してください');
    console.log('');
});

// サーバーエラーハンドリング
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ エラー: ポート ${PORT} は既に使用されています。`);
        console.log('💡 解決方法:');
        console.log('   1. 他のプロセスを停止する');
        console.log('   2. または別のポートを使用する: PORT=3000 node server.js');
    } else {
        console.error('❌ サーバーエラー:', error);
    }
});

// プロセス終了時の処理
process.on('SIGINT', () => {
    console.log('\n👋 サーバーを停止しています...');
    server.close(() => {
        console.log('✅ サーバーが停止しました。');
        process.exit(0);
    });
});