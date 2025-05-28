javascript:(function(){
  // 1. 設定値の定義
  var PROXY_API_ENDPOINT = 'http://localhost:8000/api/';
  var DIRECT_API_ENDPOINT = 'https://aablnq3wnk.execute-api.ap-northeast-1.amazonaws.com/report-v2t-dev';
  var SK = '20250521095554';
  var DEBUG_MODE = true; // デバッグモードを有効にして問題を特定
  
  // デバッグ用ログ関数
  function debugLog(message, data) {
      if (DEBUG_MODE) {
          console.log('[DEBUG] ' + message, data || '');
      }
  }

  // エラー詳細表示関数
  function showDetailedError(title, error, context) {
      var errorInfo = {
          title: title,
          message: error.message || 'Unknown error',
          status: error.status || 'N/A',
          statusText: error.statusText || 'N/A',
          context: context || {},
          timestamp: new Date().toISOString()
      };
      
      debugLog('詳細エラー', errorInfo);
      
      if (DEBUG_MODE) {
          var errorMessage = '❌ ' + title + '\n\n' +
                           '詳細: ' + errorInfo.message + '\n' +
                           'ステータス: ' + errorInfo.status + ' ' + errorInfo.statusText + '\n' +
                           '時刻: ' + errorInfo.timestamp;
          alert(errorMessage);
      }
      
      return errorInfo;
  }

  debugLog('ブックマークレット開始', { 
      proxyEndpoint: PROXY_API_ENDPOINT, 
      directEndpoint: DIRECT_API_ENDPOINT 
  });

  // URLパラメータ解析
  function getUrlParam(name) {
      try {
          var regex = new RegExp('[?&]' + name + '=([^&#]*)');
          var results = regex.exec(window.location.search);
          return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
      } catch (error) {
          debugLog('URLパラメータ解析エラー', error);
          return null;
      }
  }

  var employeeIdFromUrl = getUrlParam('employeeId');
  var pk = employeeIdFromUrl || prompt('Employee IDを入力してください:', 'm-yamashita');

  if (!pk) {
      alert('Employee IDが指定されていないため処理を終了します。');
      return;
  }

  debugLog('使用するEmployee ID', { employeeId: pk });

  // 2. 複数戦略でのデータ取得（改良版）
  function fetchDataWithFallback(employeeId, callback) {
      var strategies = [
          {
              name: 'プロキシ経由',
              url: PROXY_API_ENDPOINT + '?employeeID=' + encodeURIComponent(employeeId),
              timeout: 10000
          },
          {
              name: '直接アクセス（シンプル）',
              url: DIRECT_API_ENDPOINT + '?employeeID=' + encodeURIComponent(employeeId),
              timeout: 15000
          }
      ];
      
      var currentStrategyIndex = 0;
      
      function tryNextStrategy() {
          if (currentStrategyIndex >= strategies.length) {
              debugLog('全ての戦略が失敗');
              showFallbackOptions(employeeId, callback);
              return;
          }
          
          var strategy = strategies[currentStrategyIndex];
          debugLog('戦略試行開始', { 
              index: currentStrategyIndex + 1, 
              name: strategy.name, 
              url: strategy.url 
          });
          
          var xhr = new XMLHttpRequest();
          xhr.open('GET', strategy.url, true);
          xhr.timeout = strategy.timeout;
          
          // プリフライトリクエストを避けるためヘッダーは最小限
          // xhr.setRequestHeader('Content-Type', 'application/json'); // コメントアウト
          
          xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                  debugLog('戦略応答受信', { 
                      strategy: strategy.name,
                      status: xhr.status, 
                      statusText: xhr.statusText,
                      responseLength: xhr.responseText ? xhr.responseText.length : 0
                  });
                  
                  if (xhr.status === 200) {
                      try {
                          var data = JSON.parse(xhr.responseText);
                          debugLog('戦略成功', { strategy: strategy.name, dataType: typeof data });
                          processApiResponse(data, callback);
                          return;
                      } catch (parseError) {
                          var errorInfo = showDetailedError(
                              strategy.name + ' - JSON解析エラー',
                              parseError,
                              { 
                                  responseText: xhr.responseText.substring(0, 500),
                                  strategy: strategy.name 
                              }
                          );
                      }
                  } else {
                      var errorInfo = showDetailedError(
                          strategy.name + ' - HTTPエラー',
                          { 
                              message: 'HTTP ' + xhr.status + ' ' + xhr.statusText,
                              status: xhr.status,
                              statusText: xhr.statusText
                          },
                          { 
                              url: strategy.url,
                              responseText: xhr.responseText 
                          }
                      );
                  }
                  
                  // 次の戦略を試行
                  currentStrategyIndex++;
                  setTimeout(tryNextStrategy, 2000);
              }
          };
          
          xhr.onerror = function() {
              var errorInfo = showDetailedError(
                  strategy.name + ' - ネットワークエラー',
                  { message: 'ネットワーク接続に失敗しました' },
                  { url: strategy.url }
              );
              
              currentStrategyIndex++;
              setTimeout(tryNextStrategy, 2000);
          };
          
          xhr.ontimeout = function() {
              var errorInfo = showDetailedError(
                  strategy.name + ' - タイムアウト',
                  { message: 'リクエストがタイムアウトしました' },
                  { url: strategy.url, timeout: strategy.timeout }
              );
              
              currentStrategyIndex++;
              setTimeout(tryNextStrategy, 2000);
          };
          
          try {
              xhr.send();
          } catch (sendError) {
              showDetailedError(
                  strategy.name + ' - 送信エラー',
                  sendError,
                  { url: strategy.url }
              );
              
              currentStrategyIndex++;
              setTimeout(tryNextStrategy, 1000);
          }
      }
      
      // 最初の戦略を開始
      tryNextStrategy();
  }

  // 3. フォールバックオプション表示
  function showFallbackOptions(employeeId, callback) {
      var options = [
          '1. 再試行する（ページリロード）',
          '2. テストデータを使用する',
          '3. 手動でデータを入力する',
          '4. サーバー状態を確認する',
          '5. キャンセル'
      ];
      
      var message = '🚨 API接続に失敗しました\n\n' +
                   '以下のオプションから選択してください:\n' +
                   options.join('\n');
      
      var choice = prompt(message, '2');
      
      switch(choice) {
          case '1':
              debugLog('再試行選択 - ページリロード');
              location.reload();
              break;
              
          case '2':
              debugLog('テストデータ使用選択');
              var testData = {
                  meeting_purpose: '🧪 テストデータ: API接続に失敗したため、サンプルデータを表示しています。実際の使用時は正常なデータが取得されます。'
              };
              callback(testData);
              break;
              
          case '3':
              debugLog('手動データ入力選択');
              var manualData = prompt('営業日報の内容を入力してください:', '');
              if (manualData && manualData.trim()) {
                  callback({ meeting_purpose: manualData.trim() });
              } else {
                  alert('入力がキャンセルされました。');
                  callback(null);
              }
              break;
              
          case '4':
              debugLog('サーバー状態確認選択');
              checkServerStatus(employeeId, callback);
              break;
              
          default:
              debugLog('キャンセル選択');
              callback(null);
              break;
      }
  }

  // 4. サーバー状態確認
  function checkServerStatus(employeeId, callback) {
      var checks = [
          { name: 'ローカルサーバー', url: 'http://localhost:8000/' },
          { name: 'プロキシAPI', url: 'http://localhost:8000/api/?test=1' }
      ];
      
      var results = [];
      var completed = 0;
      
      checks.forEach(function(check, index) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', check.url, true);
          xhr.timeout = 5000;
          
          xhr.onreadystatechange = function() {
              if (xhr.readyState === 4) {
                  results[index] = {
                      name: check.name,
                      status: xhr.status,
                      success: xhr.status >= 200 && xhr.status < 400
                  };
                  
                  completed++;
                  if (completed === checks.length) {
                      showServerCheckResults(results, employeeId, callback);
                  }
              }
          };
          
          xhr.onerror = function() {
              results[index] = {
                  name: check.name,
                  status: 'ERROR',
                  success: false
              };
              
              completed++;
              if (completed === checks.length) {
                  showServerCheckResults(results, employeeId, callback);
              }
          };
          
          xhr.send();
      });
  }

  // 5. サーバーチェック結果表示
  function showServerCheckResults(results, employeeId, callback) {
      var message = '🔍 サーバー状態チェック結果:\n\n';
      
      results.forEach(function(result) {
          var status = result.success ? '✅' : '❌';
          message += status + ' ' + result.name + ': ' + result.status + '\n';
      });
      
      message += '\n対処法:\n';
      message += '• ローカルサーバーが❌の場合: node server.js を実行\n';
      message += '• プロキシAPIが❌の場合: server.jsを再起動\n';
      message += '• 全て❌の場合: ネットワーク接続を確認';
      
      alert(message);
      showFallbackOptions(employeeId, callback);
  }

  // 6. APIレスポンス処理
  function processApiResponse(data, callback) {
      debugLog('APIレスポンス処理開始', { dataType: typeof data, isArray: Array.isArray(data) });
      
      if (!Array.isArray(data)) {
          showDetailedError(
              'APIデータ形式エラー',
              { message: '配列形式のデータが期待されましたが、' + typeof data + '型が返されました' },
              { receivedData: data }
          );
          callback(null);
          return;
      }

      var targetData = null;
      for (var i = 0; i < data.length; i++) {
          if (data[i] && data[i].sk === SK) {
              targetData = data[i];
              break;
          }
      }

      if (!targetData) {
          var availableSKs = data.map(function(item) {
              return item && item.sk ? item.sk : 'undefined';
          });
          
          showDetailedError(
              'ソートキー不一致',
              { message: '指定されたソートキー (' + SK + ') が見つかりませんでした' },
              { searchedSK: SK, availableSKs: availableSKs }
          );
          callback(null);
          return;
      }

      if (!targetData.meeting_data) {
          showDetailedError(
              'meeting_data不存在',
              { message: '取得したデータにmeeting_dataが含まれていません' },
              { targetData: targetData }
          );
          callback(null);
          return;
      }

      debugLog('APIレスポンス処理完了', { meeting_data: targetData.meeting_data });
      callback(targetData.meeting_data);
  }

  // 7. フォーム入力処理
  function fillFormFields(meetingData) {
      if (!meetingData) {
          debugLog('meetingDataがnull - フォーム入力スキップ');
          return;
      }

      debugLog('フォーム入力開始', { meetingDataKeys: Object.keys(meetingData) });

      var fieldMap = {
          'meeting_purpose': '日報を入力',
          'cost': 'コスト',
          'hearing_contents': 'ヒアリング内容',
          'visit_purpose': '訪問目的',
          'meeting_content': '商談内容'
      };

      var successCount = 0;
      var failCount = 0;
      var skippedCount = 0;
      var results = [];

      for (var key in fieldMap) {
          if (meetingData.hasOwnProperty(key)) {
              var placeholder = fieldMap[key];
              var value = meetingData[key];
              
              if (!value || value.toString().trim() === '') {
                  skippedCount++;
                  results.push('⏭️ ' + key + ': 値が空のためスキップ');
                  continue;
              }
              
              debugLog('フィールド処理', { key: key, placeholder: placeholder, valueLength: value.length });
              
              var elements = document.querySelectorAll('input[placeholder="' + placeholder + '"], textarea[placeholder="' + placeholder + '"]');
              
              if (elements.length === 0) {
                  elements = document.querySelectorAll('input[placeholder*="' + placeholder + '"], textarea[placeholder*="' + placeholder + '"]');
              }

              if (elements.length > 0) {
                  for (var i = 0; i < elements.length; i++) {
                      try {
                          elements[i].value = value;
                          
                          // React/Vue.js対応イベント
                          ['input', 'change', 'blur'].forEach(function(eventType) {
                              var event = new Event(eventType, { bubbles: true, cancelable: true });
                              elements[i].dispatchEvent(event);
                          });
                          
                          successCount++;
                          results.push('✅ ' + elements[i].tagName + '[placeholder="' + placeholder + '"] 設定完了');
                          
                      } catch (error) {
                          failCount++;
                          results.push('❌ ' + elements[i].tagName + '[placeholder="' + placeholder + '"] 設定失敗: ' + error.message);
                      }
                  }
              } else {
                  failCount++;
                  results.push('❌ Placeholder "' + placeholder + '" の要素が見つかりません');
              }
          } else {
              results.push('⚠️ meetingDataにキー "' + key + '" が存在しません');
          }
      }

      // 結果表示
      var summaryMessage = '📝 データ入力完了\n\n' + 
                         '✅ 成功: ' + successCount + '件\n' + 
                         '❌ 失敗: ' + failCount + '件\n' + 
                         '⏭️ スキップ: ' + skippedCount + '件';
      
      if (DEBUG_MODE || failCount > 0) {
          summaryMessage += '\n\n詳細:\n' + results.join('\n');
      }
      
      alert(summaryMessage);
      debugLog('フォーム入力完了', { successCount: successCount, failCount: failCount, skippedCount: skippedCount });
  }

  // 8. メイン処理実行
  debugLog('メイン処理開始');
  
  fetchDataWithFallback(pk, function(meetingData) {
      if (meetingData) {
          fillFormFields(meetingData);
      } else {
          debugLog('meetingDataの取得に失敗');
          alert('❌ データの取得に失敗しました。処理を終了します。');
      }
      debugLog('メイン処理完了');
  });
})();