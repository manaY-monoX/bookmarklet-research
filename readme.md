# Bookmarklet Tests

## 概要

このリポジトリは、Bookmarkletのテスト用に作成されたものです。Bookmarkletは、ブラウザのブックマークバーに保存できる小さなJavaScriptコードで、ウェブページ上で直接実行できます。

## 使用方法

1. index.hsmlをブラウザで開きます。
2. 下にあるBookmarkletの作成方法を参照し、Bookamkletコードを作成します。
3. ブックマークバーに表示されている「Bookmarklet」をクリックします。
4. ブックマークレットが実行され、指定されたアクションがウェブページ上で実行されます。

## Bookmarkletの作成方法

Bookmarkletを作成するには、以下の手順に従います。

1. terminalで以下のコマンドを実行して、code.jsをminify.jsで圧縮します。

``` bash

## minify.js実行コマンド

``` bash
node minify.js code.js
```

2. minify.jsを実行すると、圧縮されたJavaScriptコード(bookmarklet.js)が生成されます。

3. 生成されたbookmarklet.jsの内容をコピーします。

4. ブラウザのブックマークバーに新しいブックマークを作成し、URLフィールドに以下の形式でコードを貼り付けます。

5. ブックマークの名前を設定し、保存します。

## ファイルの説明

このリポジトリには、以下のファイルが含まれています。

- `index.hsml`: Bookmarkletのテスト用のHTMLファイルです。ブラウザで開いて、Bookmarkletを実行できます。
- `code.js`: BookmarkletのJavaScriptコードです。これをminify.jsで圧縮して、Bookmarkletとして使用します。
- `minify.js`: code.jsを圧縮するためのスクリプトです。Node.jsを使用して実行します。
- `test.js`: Bookmarkletのテスト用のJavaScriptコードです。Bookmarkletが正しく動作するかを確認するために使用します。（Safari/iOS, Safari/macでは動くことを確認）
- `bookmarklet.js`: minify.jsによってcode.jsを圧縮し、生成されたBookmarkletコードです。
- `README.md`: このドキュメントファイルです。Bookmarkletの使用方法や作成方法について説明しています。