javascript:const fs = require('fs'); const path = require('path'); function min ifyJavaScript(code) { console.log('🔄 Minify処理を開始します...'); const stringLiterals = []; let stringCounter = 0; console.log('📝 文字列リテラルを保護中...'); code = code.replace(/("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`(?:[^`\\]|\\.)*`)/g, (match, p1, p2, p3) => {
    const placeholder = `__JS_STRING_${stringCounter++}__`;
    stringLiterals.push({ placeholder: placeholder, original: match });
    return placeholder;
  });
  console.log(`✅ ${stringLiterals.length}個の文字列リテラルを保護しました`);

  // Step 2: 複数行コメント /* ... */ を削除
  console.log('🗑️ 複数行コメントを削除中...');
  const beforeMultilineComments = code.length;
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  console.log(`✅ ${beforeMultilineComments - code.length}文字の複数行コメントを削除しました`);

  // Step 3: 特定の末尾コメント行を削除
  console.log('🗑️ 特定のコメント行を削除中...');
  const beforeSpecificComments = code.length;
  code = code.replace(/^\s*\/\/minified.*$/gm, '');
  code = code.replace(/^\s*\/\/ javascript:.*$/gm, '');
  console.log(`✅ ${beforeSpecificComments - code.length}文字の特定コメントを削除しました`);

  // Step 4: 単一行コメント // を削除（改良版）
  console.log('🗑️ 単一行コメントを削除中...');
  const beforeSingleComments = code.length;
  // より安全な単一行コメント削除（文字列内の//を保護）
  code = code.replace(/^\s*\/\/.*$/gm, ''); // 行頭のコメント
  code = code.replace(/([^"'`])\/\/.*$/gm, '$1'); // 行中のコメント（文字列外）
  console.log(`✅ ${beforeSingleComments - code.length}文字の単一行コメントを削除しました`);

  // Step 5: 空行を削除
  console.log('🗑️ 空行を削除中...');
  const beforeEmptyLines = code.split('\n').length;
  code = code.replace(/^\s*\n/gm, '');
  const afterEmptyLines = code.split('\n').length;
  console.log(`✅ ${beforeEmptyLines - afterEmptyLines}行の空行を削除しました`);

  // Step 6: 空白文字の正規化
  console.log('🔧 空白文字を正規化中...');
  const beforeWhitespace = code.length;
  code = code.replace(/\s+/g, ' ');
  console.log(`✅ ${beforeWhitespace - code.length}文字の空白を正規化しました`);

  // Step 7: 演算子周りのスペース調整
  console.log('🔧 演算子周りのスペースを調整中...');
  code = code.replace(/;\s*([^\s])/g, '; $1'); // セミコロン後
  code = code.replace(/\}\s*\(/g, '} ('); // }の後の(
  code = code.replace(/\)\s*\(/g, ') ('); // )の後の(
  code = code.replace(/,\s*([^\s])/g, ', $1'); // カンマ後

  // Step 8: キーワード前のスペース確保
  console.log('🔧 キーワード前のスペースを確保中...');
  code = code.replace(/([^\s;{])\s*(var|function|return|if|for|while|do|switch|try|catch|finally|throw|new|else)\s/g, '$1 $2 ');

  // Step 9: 前後の空白をトリム
  console.log('✂️ 前後の空白をトリム中...');
  code = code.replace(/^\s+|\s+$/g, '');

  // Step 10: 末尾セミコロンの確保
  if (!code.endsWith('; ')) {
    code += '; ';
    console.log('✅ 末尾にセミコロンを追加しました');
  }

  // Step 11: 文字列リテラルを復元
  console.log('🔄 文字列リテラルを復元中...');
  stringLiterals.forEach((item, index) => {
    const regex = new RegExp(item.placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    code = code.replace(regex, item.original);
  });
  console.log(`✅ ${stringLiterals.length}個の文字列リテラルを復元しました`);

  // 最終検証
  console.log('🔍 最終検証中...');
  
  // 基本的な構文チェック
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  
  if (openBraces !== closeBraces) {
    console.warn(`⚠️ 警告: 中括弧の数が一致しません (開く: ${openBraces}, 閉じる: ${closeBraces})`);
  }
  
  if (openParens !== closeParens) {
    console.warn(`⚠️ 警告: 括弧の数が一致しません (開く: ${openParens}, 閉じる: ${closeParens})`);
  }

  console.log('✅ Min ify処理が完了しました');
  return code;
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 圧縮率を計算
 */
function calculateCompressionRatio(originalSize, compressedSize) {
  const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  return ratio + '%';
}

// メイン処理
console.log('🚀 JavaScript Min ifier - 改良版');
console.log('================================');

// コマンドライン引数の取得
const inputFileName = process.argv[2];
const outputFileName = process.argv[3] || 'bookmarklet.js';

if (!inputFileName) {
  console.error('❌ エラー: 入力ファイル名が指定されていません');
  console.log('使用方法: node min ify.js <入力ファイル名> [出力ファイル名]');
  console.log('例: node min ify.js code.js bookmarklet.js');
  process.exit(1);
}

const inputFilePath = path.resolve(process.cwd(), inputFileName);
const outputFilePath = path.resolve(process.cwd(), outputFileName);

console.log(`📂 入力ファイル: ${inputFileName}`);
console.log(`📂 出力ファイル: ${outputFileName}`);
console.log('--------------------------------');

try {
  // ファイル存在チェック
  if (!fs.existsSync(inputFilePath)) {
    throw new Error(`入力ファイルが存在しません: ${inputFileName}`);
  }

  // ファイル読み込み
  console.log('📖 ファイルを読み込み中...');
  let originalCode = fs.readFileSync(inputFilePath, 'utf8');
  const originalSize = originalCode.length;
  
  console.log(`📊 元ファイルサイズ: ${formatFileSize(originalSize)}`);

  // javascript: プレフィックスの除去
  const hadPrefix = originalCode.startsWith('javascript:');
  if (hadPrefix) {
    originalCode = originalCode.replace(/^javascript:\s*/, '');
    console.log('✅ javascript: プレフィックスを除去しました');
  }

  // Minify実行
  const minifiedCode = minifyJavaScript(originalCode);
  const minifiedSize = minifiedCode.length;

  // 結果の保存
  console.log('💾 結果を保存中...');
  const finalCode = `javascript:${minifiedCode}`;
  fs.writeFileSync(outputFilePath, finalCode, 'utf8');

  // 統計情報の表示
  console.log('--------------------------------');
  console.log('📊 処理結果:');
  console.log(`  元のサイズ: ${formatFileSize(originalSize)}`);
  console.log(`  圧縮後サイズ: ${formatFileSize(minifiedSize)}`);
  console.log(`  最終ファイルサイズ: ${formatFileSize(finalCode.length)}`);
  console.log(`  圧縮率: ${calculateCompressionRatio(originalSize, minifiedSize)}`);
  console.log(`  出力パス: ${outputFilePath}`);
  console.log('--------------------------------');
  console.log('✅ 処理完了！');

  // 追加の検証
  if (minifiedCode.length < 10) {
    console.warn('⚠️ 警告: 出力が非常に短いです。処理に問題がある可能性があります。');
  }

} catch (error) {
  console.error('❌ エラーが発生しました:');
  console.error(`  ${error.message}`);
  
  if (error.code === 'ENOENT') {
    console.error(' ファイルパスを確認してください。');
  } else if (error.code === 'EACCES') {
    console.error(' ファイルアクセス権限を確認してください。'); } process.exit(1); };