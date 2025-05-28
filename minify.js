// minify.js

const fs = require('fs');
const path = require('path');

/**
 * JavaScriptコードをMinifyして一行にする関数
 * - コメント（複数行、単一行）を削除
 * - 文字列リテラル（ダブルクォート、シングルクォート、バックティック）を保護
 * - 改行を削除
 * - あらゆる種類の空白を単一スペースに統一
 * - 前後の空白をトリム（あらゆる種類の空白を対象）
 * - 必要に応じてセミコロンやスペースを挿入
 * @param {string} code - Minifyする元のJavaScriptコード
 * @returns {string} Minifyされた一行のJavaScriptコード
 */
function minifyJavaScript(code) {
  const stringLiterals = [];
  let stringCounter = 0;

  // Step 1: 文字列リテラルとテンプレートリテラルを一時的なプレースホルダーに置き換える
  // これは、正規表現による処理で文字列内部が破損するのを防ぐためです。
  code = code.replace(/("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)/g, (match, p1, p2, p3) => {
    const placeholder = `__JS_STRING_${stringCounter++}__`;
    stringLiterals.push({ placeholder: placeholder, original: match });
    return placeholder;
  });

  // 2. 複数行コメント /* ... */ を削除
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');

  // 3. 特定の末尾コメント行を削除 (code.jsファイル固有の対応)
  code = code.replace(/^\s*\/\/minifiered.*$/gm, '');
  code = code.replace(/^\s*\/\/ javascript:.*$/gm, '');

  // 4. 単一行コメント // を削除 (より包括的な方法)
  //    行頭のスペースや、コードの途中にある // コメントも削除します。
  code = code.replace(/^\s*\/\/.*$/gm, '');

  // 5. すべての空白文字 (スペース、タブ、改行、Unicodeの各種空白など) を単一スペースに置換 (NEW)
  //    これにより、あらゆる種類の空白が正規化されます。
  code = code.replace(/\s+/g, ' ');

  // 6. セミコロンの直後にスペースがない場合、スペースを挿入
  code = code.replace(/;(\S)/g, '; $1');

  // 7. `{` `}` `(` `)` `[` `]` の直後にスペースがない場合、スペースを挿入
  code = code.replace(/\}\(/g, '} (');
  code = code.replace(/\)\(/g, ') (');

  // 8. `var`, `function`, `return` などのキーワードの直前にスペースを挿入
  code = code.replace(/([^\s;])(var|function|return|if|for|while|do|switch|try|catch|finally|throw|new)/g, '$1 $2');

  // 9. コードの前後のあらゆる種類の空白をトリム (NEW)
  //    `trim()` よりも強力に、改行や非標準の空白文字も除去します。
  code = code.replace(/^\s+|\s+$/g, '');

  // 10. 最後のセミコロンが欠落している可能性を考慮して、末尾に強制的に追加
  if (!code.endsWith(';')) {
      code += ';';
  }

  // Step 11: プレースホルダーを元の文字列リテラルに戻す
  stringLiterals.forEach(item => {
    const regex = new RegExp(item.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    code = code.replace(regex, item.original);
  });

  return code;
}

// コマンドライン引数から入力ファイル名を取得
const inputFileName = process.argv[2];
// 出力ファイル名は固定で 'bookmarklet.js' とする
const outputFileName = 'bookmarklet.js';

if (!inputFileName) {
  console.error('使用方法: node minify.js <入力ファイル名>');
  process.exit(1); // エラー終了
}

// 入力ファイルの絶対パスを生成
const inputFilePath = path.resolve(process.cwd(), inputFileName);
// 出力ファイルの絶対パスを生成 (入力ファイルと同じディレクトリ)
const outputFilePath = path.resolve(process.cwd(), outputFileName);

try {
  // ファイルの内容を同期的に読み込む
  let originalCode = fs.readFileSync(inputFilePath, 'utf8');

  // `javascript:` プレフィックスが既に存在する場合は削除
  originalCode = originalCode.replace(/^javascript:\s*/, '');

  // JavaScriptコードをMinify
  const minifiedCode = minifyJavaScript(originalCode);

  // Minifyされたコードを bookmarklet.js に書き込む
  // `javascript:` プレフィックスを付けて書き込む
  fs.writeFileSync(outputFilePath, `javascript:${minifiedCode}`, 'utf8');

  console.log(`✅ ${inputFileName} をMinifyし、${outputFileName} に出力しました。`);
  console.log(`出力パス: ${outputFilePath}`);

} catch (error) {
  if (error.code === 'ENOENT') {
    console.error(`エラー: 入力ファイルが見つかりません - ${inputFileName}`);
  } else {
    console.error(`ファイル処理中にエラーが発生しました: ${error.message}`);
  }
  process.exit(1); // エラー終了
}