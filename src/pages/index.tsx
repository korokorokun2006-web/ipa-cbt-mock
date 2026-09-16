import React from 'react';

export default function Home() {
  return (
    <main style={{padding:32,fontFamily:'sans-serif'}}>
      <h1>IPA CBT Mock — プロジェクト雛形</h1>
      <p>このリポジトリは、IP/FE/AP/DB の統合CBT模擬試験プラットフォームです。</p>
      <p>現在：プロジェクト骨格をコミット済み。問題バンクを順次追加します。</p>
      <ul>
        <li>開発：Next.js + TypeScript</li>
        <li>DB：PostgreSQL + Prisma</li>
        <li>認証：メール/パスワード（JWT）予定</li>
      </ul>
    </main>
  );
}
