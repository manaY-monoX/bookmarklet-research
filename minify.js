// minify.js - 超安全版（最小限の処理のみ）

const fs = require('fs');
const path = require('path');

/**
 * 最小限で最も安全なJavaScript minify関数
 * 構文を破壊するリスクを最小限に抑える
 */
function minifyJavaScript(code) {
  console.log('🔄 超安全なMinify処理を開始します...');
  
  const protectedElements = [];
  let counter = 0;
  
  // Step 1: 文字列リテラル（ダブルクォート、シングルクォート、バックティック）を保護
  console.log('📝 文字列リテラルを保護中...');
  
  // ダブルクォート文字列を保護
  code = code.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
    const placeholder = `__STR_${counter++}__`;
    protectedElements.push({ placeholder, original: match });
    return placeholder;
  });
  
  // シングルクォート文字列を保護
  code = code.replace(/'(?:[^'\\]|\\.)*'/g, (match) => {
    const placeholder = `__STR_${counter++}__`;
    protectedElements.push({ placeholder, original: match });
    return placeholder;
  });
  
  // バックティック文字列を保護
  code = code.replace(/`(?:[^`\\]|\\.)*`/g, (match) => {
    const placeholder = `__STR_${counter++}__`;
    protectedElements.push({ placeholder, original: match });
    return placeholder;
  });
  
  console.log(`✅ ${protectedElements.length}個の文字列リテラルを保護しました`);
  
  // Step 2: 複数行コメント /* ... */ を削除（最も安全な方法）
  console.log('🗑️ 複数行コメントを削除中...');
  let beforeComments = code.length;
  code = code.replace(/\/\*[\s\S]*?\*\//g, '');
  console.log(`✅ ${beforeComments - code.length}文字のコメントを削除しました`);
  
  // Step 3: 行コメント // を削除（行末まで）
  console.log('🗑️ 行コメントを削除中...');
  beforeComments = code.length;
  code = code.replace(/\/\/.*$/gm, '');
  console.log(`✅ ${beforeComments - code.length}文字のコメントを削除しました`);
  
  // Step 4: 空行を削除
  console.log('🗑️ 空行を削除中...');
  const beforeLines = code.split('\n').length;
  code = code.replace(/^\s*\n/gm, '');
  const afterLines = code.split('\n').length;
  console.log(`✅ ${beforeLines - afterLines}行の空行を削除しました`);
  
  // Step 5: 各行の先頭と末尾の空白を削除
  console.log('✂️ 行の前後の空白をトリム中...');
  const lines = code.split('\n');
  const trimmedLines = lines.map(line => line.trim()).filter(line => line.length > 0);
  code = trimmedLines.join('\n');
  
  // Step 6: 改行を削除して1行にする（最も慎重に）
  console.log('🔧 改行を削除中...');
  code = code.replace(/\n/g, ' ');
  
  // Step 7: 連続する空白を1つのスペースに統合
  console.log('🔧 連続する空白を統合中...');
  code = code.replace(/\s+/g, ' ');
  
  // Step 8: 全体の前後をトリム
  console.log('✂️ 全体をトリム中...');
  code = code.trim();
  
  // Step 9: 保護された文字列リテラルを復元
  console.log('🔄 文字列リテラルを復元中...');
  protectedElements.forEach((item) => {
    // 最も安全な置換方法を使用
    const regex = new RegExp(item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    code = code.replace(regex, item.original);
  });
  
  console.log(`✅ ${protectedElements.length}個の文字列リテラルを復元しました`);
  console.log('✅ 超安全Minify処理が完了しました');
  
  return code;
}

/**
 * 構文チェック関数
 */
function validateSyntax(code) {
  console.log('🔍 構文チェックを実行中...');
  
  const checks = {
    openBraces: (code.match(/\{/g) || []).length,
    closeBraces: (code.match(/\}/g) || []).length,
    openParens: (code.match(/\(/g) || []).length,
    closeParens: (code.match(/\)/g) || []).length,
    openBrackets: (code.match(/\[/g) || []).length,
    closeBrackets: (code.match(/\]/g) || []).length
  };
  
  let isValid = true;
  
  if (checks.openBraces !== checks.closeBraces) {
    console.error(`❌ 中括弧エラー: 開く${checks.openBraces}個 vs 閉じる${checks.closeBraces}個`);
    isValid = false;
  } else {
    console.log('✅ 中括弧の対応OK');
  }
  
  if (checks.openParens !== checks.closeParens) {
    console.error(`❌ 括弧エラー: 開く${checks.openParens}個 vs 閉じる${checks.closeParens}個`);
    isValid = false;
  } else {
    console.log('✅ 括弧の対応OK');
  }
  
  if (checks.openBrackets !== checks.closeBrackets) {
    console.error(`❌ 角括弧エラー: 開く${checks.openBrackets}個 vs 閉じる${checks.closeBrackets}個`);
    isValid = false;
  } else {
    console.log('✅ 角括弧の対応OK');
  }
  
  // 基本的なJavaScript関数の存在チェック
  const importantFunctions = ['JSON.stringify', 'console.log', 'document.querySelector'];
  importantFunctions.forEach(func => {
    if (code.includes(func)) {
      console.log(`✅ ${func} が正常に存在`);
    }
  });
  
  return isValid;
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// メイン処理
console.log('🚀 JavaScript Minifier - 超安全版');
console.log('====================================');

const inputFileName = process.argv[2];
const outputFileName = process.argv[3] || 'bookmarklet.js';

if (!inputFileName) {
  console.error('❌ エラー: 入力ファイル名が指定されていません');
  console.log('使用方法: node minify.js <入力ファイル名> [出力ファイル名]');
  console.log('例: node minify.js code.js bookmarklet.js');
  process.exit(1);
}

const inputFilePath = path.resolve(process.cwd(), inputFileName);
const outputFilePath = path.resolve(process.cwd(), outputFileName);

console.log(`📂 入力ファイル: ${inputFileName}`);
console.log(`📂 出力ファイル: ${outputFileName}`);
console.log('------------------------------------');

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

  // 元のコードの構文チェック
  console.log('🔍 元のコードの構文チェック...');
  const originalValid = validateSyntax(originalCode);
  
  if (!originalValid) {
    console.warn('⚠️ 元のコードに構文の問題があります。続行しますが、結果を確認してください。');
  }

  // Minify実行
  const minifiedCode = minifyJavaScript(originalCode);
  const minifiedSize = minifiedCode.length;

  // Minify後の構文チェック
  console.log('🔍 Minify後の構文チェック...');
  const minifiedValid = validateSyntax(minifiedCode);

  // 結果の保存
  console.log('💾 結果を保存中...');
  const finalCode = `javascript:${minifiedCode}`;
  fs.writeFileSync(outputFilePath, finalCode, 'utf8');

  // 統計情報の表示
  console.log('------------------------------------');
  console.log('📊 処理結果:');
  console.log(`  元のサイズ: ${formatFileSize(originalSize)}`);
  console.log(`  圧縮後サイズ: ${formatFileSize(minifiedSize)}`);
  console.log(`  最終ファイルサイズ: ${formatFileSize(finalCode.length)}`);
  console.log(`  圧縮率: ${((originalSize - minifiedSize) / originalSize * 100).toFixed(1)}%`);
  console.log(`  出力パス: ${outputFilePath}`);
  console.log('------------------------------------');
  
  if (minifiedValid) {
    console.log('✅ 処理完了！構文チェックもOKです。');
  } else {
    console.error('⚠️ 処理完了しましたが、構文に問題がある可能性があります。');
    console.log('元のcode.jsファイルを確認し、必要に応じて手動で修正してください。');
  }

} catch (error) {
  console.error('❌ エラーが発生しました:');
  console.error(`  ${error.message}`);
  
  if (error.code === 'ENOENT') {
    console.error('  ファイルパスを確認してください。');
  } else if (error.code === 'EACCES') {
    console.error('  ファイルアクセス権限を確認してください。');
  }
  
  process.exit(1);
}