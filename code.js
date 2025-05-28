javascript:(function(){
    // 1. 設定値の定義
    var API_ENDPOINT = 'https://aablnq3wnk.execute-api.ap-northeast-1.amazonaws.com/report-v2t-dev';
    var SK = '20250521095554'; // 今回指定されたソートキー
    var DEBUG_MODE = true;
    
    // デバッグ用アラート関数
    function debugAlert(message, data) {
        if (DEBUG_MODE) {
            var alertMessage = '[DEBUG] ' + message;
            if (data) {
                alertMessage += '\n詳細: ' + JSON.stringify(data, null, 2);
            }
            alert(alertMessage);
            console.log('[DEBUG] ' + message, data);
        }
    }

    debugAlert('ブックマークレット開始', { API_ENDPOINT: API_ENDPOINT, SK: SK });

    // URLパラメータの解析（SafariでもURLSearchParamsを避ける）
    function getUrlParam(name) {
        var regex = new RegExp('[?&]' + name + '=([^&#]*)');
        var results = regex.exec(window.location.search);
        return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }

    var employeeIdFromUrl = getUrlParam('employeeId');
    
    debugAlert('URL解析結果', { 
        currentUrl: window.location.href,
        employeeIdFromUrl: employeeIdFromUrl 
    });

    var pk = employeeIdFromUrl || prompt('データを取得するためのEmployee IDを入力してください:', 'm-yamashita');

    if (!pk) {
        alert('Employee IDが指定されていないため処理を中止します。');
        return;
    }

    debugAlert('使用するEmployee ID', { pk: pk });

    // 2. APIからデータを取得する関数
    function fetchData(employeeId, callback) {
        var url = API_ENDPOINT + '?employeeID=' + encodeURIComponent(employeeId);
        
        debugAlert('API呼び出し開始', { url: url });
        
        // XMLHttpRequestを使用（iOSでのfetch互換性を考慮）
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                debugAlert('API応答受信', { 
                    status: xhr.status, 
                    statusText: xhr.statusText 
                });

                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        debugAlert('APIデータ取得成功', { 
                            dataType: typeof data,
                            isArray: Array.isArray(data),
                            dataLength: Array.isArray(data) ? data.length : 'N/A'
                        });

                        // 指定されたSKを持つエントリを探す
                        var targetData = null;
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].sk === SK) {
                                targetData = data[i];
                                break;
                            }
                        }

                        if (!targetData) {
                            var availableSKs = [];
                            for (var i = 0; i < data.length; i++) {
                                availableSKs.push(data[i].sk);
                            }
                            debugAlert('データ検索結果', { 
                                searchedSK: SK,
                                availableSKs: availableSKs,
                                found: false
                            });
                            alert('指定されたソートキー (' + SK + ') に一致するデータが見つかりませんでした。');
                            callback(null);
                            return;
                        }

                        debugAlert('ターゲットデータ発見', { 
                            targetData: targetData,
                            meetingData: targetData.meeting_data 
                        });

                        callback(targetData.meeting_data);
                    } catch (parseError) {
                        debugAlert('JSON解析エラー', { 
                            error: parseError.message,
                            responseText: xhr.responseText 
                        });
                        alert('データの解析に失敗しました: ' + parseError.message);
                        callback(null);
                    }
                } else {
                    debugAlert('API エラー応答', { 
                        status: xhr.status,
                        responseText: xhr.responseText 
                    });
                    alert('データの取得に失敗しました。ステータス: ' + xhr.status);
                    callback(null);
                }
            }
        };

        xhr.onerror = function() {
            debugAlert('XMLHttpRequest エラー');
            alert('ネットワークエラーが発生しました。');
            callback(null);
        };

        xhr.send();
    }

    // 3. 取得したデータをフォームフィールドに書き込む関数
    function fillFormFields(meetingData) {
        if (!meetingData) {
            debugAlert('meetingDataがnullまたはundefined', { meetingData: meetingData });
            console.warn('meetingDataがnullまたはundefinedのため、フォームフィールドへの書き込みをスキップします。');
            return;
        }

        debugAlert('フォーム入力開始', { meetingData: meetingData });

        // DynamoDBのデータ構造に応じてフィールドをマップ
        var fieldMap = {
            'meeting_purpose': '日報を入力'
            // 他のフィールドも必要に応じて追加
            // 'cost': 'cost',
            // 'hearing_contents': 'hearing_contents',
            // 'other': 'other',
            // 'proposal': 'proposal',
            // 'reaction': 'reaction'
        };

        debugAlert('フィールドマップ', { fieldMap: fieldMap });

        var successCount = 0;
        var failCount = 0;
        var results = [];

        for (var key in fieldMap) {
            if (meetingData.hasOwnProperty(key)) {
                var placeholderName = fieldMap[key];
                var valueToSet = meetingData[key];

                debugAlert('フィールド処理中', { 
                    key: key, 
                    placeholderName: placeholderName, 
                    valueToSet: valueToSet 
                });

                // inputタグとtextareaタグの両方を検索
                var elements = document.querySelectorAll('input[placeholder="' + placeholderName + '"], textarea[placeholder="' + placeholderName + '"]');

                debugAlert('要素検索結果', { 
                    placeholderName: placeholderName,
                    foundElements: elements.length
                });

                if (elements.length > 0) {
                    for (var i = 0; i < elements.length; i++) {
                        var element = elements[i];
                        try {
                            // 値を設定
                            element.value = valueToSet;

                            // Reactがvalueの変更を検知できるようにイベントを発火
                            var inputEvent = new Event('input', { bubbles: true });
                            element.dispatchEvent(inputEvent);
                            
                            var changeEvent = new Event('change', { bubbles: true });
                            element.dispatchEvent(changeEvent);

                            successCount++;
                            results.push('✅ ' + element.tagName + '[placeholder="' + placeholderName + '"] に "' + valueToSet + '" を設定');
                            
                            debugAlert('要素への入力成功', { 
                                elementIndex: i,
                                tagName: element.tagName,
                                placeholderName: placeholderName,
                                valueToSet: valueToSet
                            });

                        } catch (elementError) {
                            failCount++;
                            results.push('❌ ' + element.tagName + '[placeholder="' + placeholderName + '"] の設定に失敗: ' + elementError.message);
                            
                            debugAlert('要素への入力失敗', { 
                                elementIndex: i,
                                error: elementError.message
                            });
                        }
                    }
                } else {
                    failCount++;
                    results.push('❌ Placeholder "' + placeholderName + '" を持つ要素が見つかりませんでした');
                    
                    var allPlaceholders = [];
                    var allElements = document.querySelectorAll('input[placeholder], textarea[placeholder]');
                    for (var i = 0; i < allElements.length; i++) {
                        allPlaceholders.push(allElements[i].placeholder);
                    }
                    
                    debugAlert('要素が見つからない', { 
                        placeholderName: placeholderName,
                        availablePlaceholders: allPlaceholders
                    });
                }
            } else {
                var availableKeys = [];
                for (var prop in meetingData) {
                    availableKeys.push(prop);
                }
                debugAlert('meetingDataにキーが存在しない', { 
                    missingKey: key,
                    availableKeys: availableKeys
                });
                results.push('⚠️ meetingDataにキー "' + key + '" が見つかりませんでした');
            }
        }

        // 最終結果の表示
        var summaryMessage = 'データ入力完了\n成功: ' + successCount + '件\n失敗: ' + failCount + '件\n\n詳細:\n' + results.join('\n');
        alert(summaryMessage);
        
        debugAlert('フォーム入力完了', { 
            successCount: successCount, 
            failCount: failCount, 
            results: results 
        });
    }

    // 4. 処理の実行
    debugAlert('メイン処理開始');
    
    fetchData(pk, function(meetingData) {
        if (meetingData) {
            fillFormFields(meetingData);
        } else {
            alert('meetingDataが取得できませんでした。処理を終了します。');
        }
        debugAlert('メイン処理完了');
    });
})();
