javascript:(function(){
  // 1. 設定値の定義
  var API_ENDPOINT = 'https://aablnq3wnk.execute-api.ap-northeast-1.amazonaws.com/report-v2t-dev';
  var SK = '20250521095554'; // 今回指定されたソートキー
  var DEBUG_MODE = false; // 本番環境では false に設定
  
  // デバッグ用ログ関数（改良版）
  function debugLog(message, data) {
      if (DEBUG_MODE) {
          var logMessage = '[DEBUG] ' + message;
          if (data) {
              logMessage += ' | データ: ' + JSON.stringify(data, null, 2);
          }
          console.log(logMessage, data || '');
          
          // 重要なエラーのみアラート表示
          if (message.includes('エラー') || message.includes('失敗')) {
              alert('[DEBUG] ' + message + (data ? '\n詳細: ' + JSON.stringify(data, null, 2) : ''));
          }
      }
  }

  debugLog('ブックマークレット開始', { API_ENDPOINT: API_ENDPOINT, SK: SK });

  // URLパラメータ解析関数（改良版）
  function getUrlParam(name) {
      try {
          var regex = new RegExp('[?&]' + name + '=([^&#]*)');
          var results = regex.exec(window.location.search);
          return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
      } catch (error) {
          debugLog('URLパラメータ解析エラー', { error: error.message, name: name });
          return null;
      }
  }

  var employeeIdFromUrl = getUrlParam('employeeId');
  
  debugLog('URL解析結果', { 
      currentUrl: window.location.href,
      employeeIdFromUrl: employeeIdFromUrl 
  });

  var pk = employeeIdFromUrl || prompt('データを取得するためのEmployee IDを入力してください:', 'm-yamashita');

  if (!pk) {
      alert('Employee IDが指定されていないため処理を中止します。');
      return;
  }

  debugLog('使用するEmployee ID', { pk: pk });

  // 2. APIからデータを取得する関数（CORS対策版）
  function fetchData(employeeId, callback) {
      var url = API_ENDPOINT + '?employeeID=' + encodeURIComponent(employeeId);
      
      debugLog('API呼び出し開始', { url: url });
      
      // XMLHttpRequestを使用（CORS対策）
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      
      // CORS対策: シンプルリクエストにするためContent-Typeヘッダーを削除
      // xhr.setRequestHeader('Content-Type', 'application/json'); // この行をコメントアウト
      
      // タイムアウト設定（30秒）
      xhr.timeout = 30000;
      
      xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
              debugLog('API応答受信', { 
                  status: xhr.status, 
                  statusText: xhr.statusText,
                  responseLength: xhr.responseText ? xhr.responseText.length : 0
              });

              if (xhr.status === 200) {
                  try {
                      var data = JSON.parse(xhr.responseText);
                      debugLog('APIデータ取得成功', { 
                          dataType: typeof data,
                          isArray: Array.isArray(data),
                          dataLength: Array.isArray(data) ? data.length : 'N/A'
                      });

                      if (!Array.isArray(data)) {
                          debugLog('APIデータ形式エラー', { expectedType: 'Array', actualType: typeof data });
                          alert('APIから取得したデータの形式が正しくありません。');
                          callback(null);
                          return;
                      }

                      // 指定されたSKを持つエントリを探す
                      var targetData = null;
                      for (var i = 0; i < data.length; i++) {
                          if (data[i] && data[i].sk === SK) {
                              targetData = data[i];
                              break;
                          }
                      }

                      if (!targetData) {
                          var availableSKs = [];
                          for (var i = 0; i < data.length; i++) {
                              if (data[i] && data[i].sk) {
                                  availableSKs.push(data[i].sk);
                              }
                          }
                          debugLog('データ検索結果', { 
                              searchedSK: SK,
                              availableSKs: availableSKs,
                              found: false
                          });
                          alert('指定されたソートキー (' + SK + ') に一致するデータが見つかりませんでした。\n利用可能なソートキー: ' + availableSKs.join(', '));
                          callback(null);
                          return;
                      }

                      debugLog('ターゲットデータ発見', { 
                          targetData: targetData,
                          hasMeetingData: !!targetData.meeting_data
                      });

                      if (!targetData.meeting_data) {
                          debugLog('meeting_dataが存在しません', { targetData: targetData });
                          alert('取得したデータにmeeting_dataが含まれていません。');
                          callback(null);
                          return;
                      }

                      callback(targetData.meeting_data);
                  } catch (parseError) {
                      debugLog('JSON解析エラー', { 
                          error: parseError.message,
                          responseText: xhr.responseText.substring(0, 200) + '...' 
                      });
                      alert('データの解析に失敗しました: ' + parseError.message);
                      callback(null);
                  }
              } else {
                  debugLog('API エラー応答', { 
                      status: xhr.status,
                      statusText: xhr.statusText,
                      responseText: xhr.responseText ? xhr.responseText.substring(0, 200) + '...' : 'レスポンスなし'
                  });
                  alert('データの取得に失敗しました。\nステータス: ' + xhr.status + ' ' + xhr.statusText);
                  callback(null);
              }
          }
      };

      xhr.onerror = function() {
          debugLog('XMLHttpRequest ネットワークエラー');
          alert('ネットワークエラーが発生しました。インターネット接続を確認してください。');
          callback(null);
      };

      xhr.ontimeout = function() {
          debugLog('XMLHttpRequest タイムアウトエラー');
          alert('リクエストがタイムアウトしました。しばらくしてから再試行してください。');
          callback(null);
      };

      xhr.send();
  }

  // 3. フォームフィールドのマッピング（拡張版）
  function getFieldMap() {
      return {
          'meeting_purpose': '日報を入力',
          'cost': 'コスト',
          'hearing_contents': 'ヒアリング内容',
          'other': 'その他',
          'proposal': '提案内容',
          'reaction': '反応',
          'visit_purpose': '訪問目的',
          'meeting_content': '商談内容'
      };
  }

  // 4. 取得したデータをフォームフィールドに書き込む関数（改良版）
  function fillFormFields(meetingData) {
      if (!meetingData) {
          debugLog('meetingDataがnullまたはundefined', { meetingData: meetingData });
          console.warn('meetingDataがnullまたはundefinedのため、フォームフィールドへの書き込みをスキップします。');
          return;
      }

      debugLog('フォーム入力開始', { 
          meetingDataKeys: Object.keys(meetingData),
          meetingDataLength: Object.keys(meetingData).length
      });

      var fieldMap = getFieldMap();
      debugLog('フィールドマップ', { fieldMap: fieldMap });

      var successCount = 0;
      var failCount = 0;
      var skippedCount = 0;
      var results = [];

      // 利用可能なplaceholderを事前に取得
      var allElements = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      var availablePlaceholders = [];
      for (var i = 0; i < allElements.length; i++) {
          availablePlaceholders.push(allElements[i].placeholder);
      }
      
      debugLog('利用可能なplaceholder', { availablePlaceholders: availablePlaceholders });

      for (var key in fieldMap) {
          if (meetingData.hasOwnProperty(key)) {
              var placeholderName = fieldMap[key];
              var valueToSet = meetingData[key];

              // 空の値はスキップ
              if (!valueToSet || valueToSet.toString().trim() === '') {
                  skippedCount++;
                  results.push('⏭️ ' + key + ': 値が空のためスキップ');
                  debugLog('値が空のためスキップ', { key: key, value: valueToSet });
                  continue;
              }

              debugLog('フィールド処理中', { 
                  key: key, 
                  placeholderName: placeholderName, 
                  valueToSet: valueToSet,
                  valueLength: valueToSet.toString().length
              });

              // より柔軟な要素検索（部分一致も含む）
              var elements = document.querySelectorAll('input[placeholder*="' + placeholderName + '"], textarea[placeholder*="' + placeholderName + '"]');
              
              // 完全一致も試す
              if (elements.length === 0) {
                  elements = document.querySelectorAll('input[placeholder="' + placeholderName + '"], textarea[placeholder="' + placeholderName + '"]');
              }

              debugLog('要素検索結果', { 
                  placeholderName: placeholderName,
                  foundElements: elements.length,
                  searchMethod: elements.length > 0 ? '部分一致' : '見つからず'
              });

              if (elements.length > 0) {
                  for (var i = 0; i < elements.length; i++) {
                      var element = elements[i];
                      try {
                          // 既存の値をバックアップ
                          var originalValue = element.value;
                          
                          // 値を設定
                          element.value = valueToSet;

                          // React/Vue.js対応: より多くのイベントを発火
                          var inputEvent = new Event('input', { bubbles: true, cancelable: true });
                          var changeEvent = new Event('change', { bubbles: true, cancelable: true });
                          var focusEvent = new Event('focus', { bubbles: true });
                          var blurEvent = new Event('blur', { bubbles: true });

                          element.dispatchEvent(focusEvent);
                          element.dispatchEvent(inputEvent);
                          element.dispatchEvent(changeEvent);
                          element.dispatchEvent(blurEvent);

                          successCount++;
                          results.push('✅ ' + element.tagName + '[placeholder*="' + placeholderName + '"] に "' + (valueToSet.length > 50 ? valueToSet.substring(0, 50) + '...' : valueToSet) + '" を設定');
                          
                          debugLog('要素への入力成功', { 
                              elementIndex: i,
                              tagName: element.tagName,
                              placeholderName: placeholderName,
                              originalValue: originalValue,
                              newValue: valueToSet
                          });

                      } catch (elementError) {
                          failCount++;
                          results.push('❌ ' + element.tagName + '[placeholder*="' + placeholderName + '"] の設定に失敗: ' + elementError.message);
                          
                          debugLog('要素への入力失敗', { 
                              elementIndex: i,
                              error: elementError.message,
                              elementType: element.tagName
                          });
                      }
                  }
              } else {
                  failCount++;
                  results.push('❌ Placeholder "' + placeholderName + '" を持つ要素が見つかりませんでした');
                  
                  debugLog('要素が見つからない', { 
                      placeholderName: placeholderName,
                      availablePlaceholders: availablePlaceholders
                  });
              }
          } else {
              var availableKeys = Object.keys(meetingData);
              debugLog('meetingDataにキーが存在しない', { 
                  missingKey: key,
                  availableKeys: availableKeys
              });
              results.push('⚠️ meetingDataにキー "' + key + '" が見つかりませんでした');
          }
      }

      // 最終結果の表示（改良版）
      var summaryMessage = '🔄 データ入力完了\n' + 
                         '✅ 成功: ' + successCount + '件\n' + 
                         '❌ 失敗: ' + failCount + '件\n' + 
                         '⏭️ スキップ: ' + skippedCount + '件\n\n';
      
      if (DEBUG_MODE || failCount > 0) {
          summaryMessage += '詳細:\n' + results.join('\n');
      }
      
      alert(summaryMessage);
      
      debugLog('フォーム入力完了', { 
          successCount: successCount, 
          failCount: failCount,
          skippedCount: skippedCount,
          results: results 
      });
  }

  // 5. 処理の実行
  debugLog('メイン処理開始');
  
  fetchData(pk, function(meetingData) {
      if (meetingData) {
          fillFormFields(meetingData);
      } else {
          alert('❌ meetingDataが取得できませんでした。処理を終了します。');
      }
      debugLog('メイン処理完了');
  });
})();