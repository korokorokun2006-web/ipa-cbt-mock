// シードスクリプト（Prisma）
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');
  // 管理者ユーザー（初期パスワードはデプロイ後に変更してください）
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@ipa-cbt.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';

  // 注：パスワードはハッシュ化して保存する実装を追加してください
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, password: adminPassword, isAdmin: true }
  });

  // 問題の読み込み（data/ip_questions.json）
  const raw = fs.readFileSync('data/ip_questions.json', 'utf-8');
  const questions = JSON.parse(raw);

  // 単純なインポート例: 1つの Exam と 1つの ExamVersion を作成して格納
  const exam = await prisma.exam.upsert({
    where: { key: 'ip' },
    update: {},
    create: { key: 'ip', title: 'ITパスポート（IP）', totalQuestions: 100, timeLimitMin: 120 }
  });

  const version = await prisma.examVersion.create({ data: { examId: exam.id, version: 'v1' } });

  for (const q of questions) {
    const created = await prisma.question.create({
      data: {
        examVersionId: version.id,
        domain: q.domain,
        difficulty: q.difficulty || 2,
        type: 'single',
        text: q.text,
        explanation: q.explanation || ''
      }
    });

    for (const c of q.choices) {
      await prisma.choice.create({ data: { questionId: created.id, label: c.label, text: c.text, isCorrect: c.isCorrect } });
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
