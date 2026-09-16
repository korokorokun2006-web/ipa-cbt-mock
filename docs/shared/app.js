// shared single-page app for static exams
(async function(){
  const cfg = window.APP_CONFIG || {examKey:'ip', title:'Exam'};
  const root = document.getElementById('app');
  const resp = await fetch('/data/' + cfg.examKey + '.json');
  const data = await resp.json();
  const QUESTIONS = data.questions;

  // --- state ---
  let user = JSON.parse(localStorage.getItem(cfg.examKey + ':user') || 'null');
  let history = JSON.parse(localStorage.getItem(cfg.examKey + ':history') || '[]');

  // render
  function renderLanding(){
    root.innerHTML = `
      <div id="container">
        <header>
          <h1>${cfg.title}</h1>
          <div>${user? 'ようこそ ' + user.name : '<button id="loginBtn">ログイン</button>'}</div>
        </header>
        <p>この模擬試験は ${data.totalQuestions} 問・制限時間 ${data.timeLimitMin} 分です。</p>
        <nav>
          <button id="startBtn">試験を始める</button>
          <button id="historyBtn" class="secondary">履歴を見る</button>
        </nav>
        <section>
          <h2>試験の説明</h2>
          <p>四肢択一式。問題はランダム（固定シード）。解答後、全問の解答と模範解答・解説を確認できます。ログインすると履歴が端末に保存されます。</p>
        </section>
      </div>`;
    document.getElementById('startBtn').onclick = startExam;
    document.getElementById('historyBtn').onclick = showHistory;
    const lb = document.getElementById('loginBtn'); if(lb) lb.onclick = showLogin;
  }

  function showLogin(){
    root.innerHTML = `<div id="container"><h1>ログイン</h1><p>任意のユーザー名を入力してください（端末ローカル保存）</p><input id="name" placeholder="名前"><button id="ok">OK</button><button id="back" class="secondary">戻る</button></div>`;
    document.getElementById('ok').onclick = ()=>{
      const name = document.getElementById('name').value || '匿名';
      user = {name, createdAt: new Date().toISOString()};
      localStorage.setItem(cfg.examKey + ':user', JSON.stringify(user));
      renderLanding();
    };
    document.getElementById('back').onclick = renderLanding;
  }

  function showHistory(){
    const items = history.slice().reverse();
    root.innerHTML = `<div id="container"><h1>受験履歴</h1><button id="back" class="secondary">戻る</button>${items.length? '<ul>' + items.map((it,idx)=>`<li><b>${it.title}</b> ${it.date} 得点:${it.score}/${it.total} <button data-idx="${items.length-1-idx}">詳細</button></li>`).join('') + '</ul>' : '<p>履歴はありません</p>'}</div>`;
    document.querySelectorAll('[data-idx]').forEach(btn=>btn.onclick = (e)=>{ const i = +btn.getAttribute('data-idx'); showResult(history[i]); });
    document.getElementById('back').onclick = renderLanding;
  }

  function startExam(){
    // choose first N questions
    const selected = QUESTIONS.slice(0, data.totalQuestions);
    const state = { qIndex:0, answers: Array(selected.length).fill(null), startedAt: Date.now(), remaining: data.timeLimitMin*60 };
    renderQuestion(selected, state);
  }

  function renderQuestion(questions, state){
    const q = questions[state.qIndex];
    root.innerHTML = `<div id="container"><header><h1>${cfg.title}</h1><div id="timer">残り: <span id="t">--:--</span></div></header><h2>問題 ${state.qIndex+1}/${questions.length}</h2><div><p>${q.text}</p></div><form id="choices">${q.choices.map(c=>`<label class="choice"><input type="radio" name="choice" value="${c.label}" ${state.answers[state.qIndex]===c.label?'checked':''}/> ${c.label}. ${c.text}</label>`).join('')}</form><footer><button id="prev" class="secondary">前へ</button><button id="next">次へ</button><button id="submit" class="secondary">提出</button></footer></div>`;

    document.getElementById('prev').onclick = ()=>{ if(state.qIndex>0){ state.qIndex--; renderQuestion(questions,state);} };
    document.getElementById('next').onclick = ()=>{ const v = document.querySelector('input[name=choice]:checked'); if(v) state.answers[state.qIndex]=v.value; if(state.qIndex+1<questions.length){ state.qIndex++; renderQuestion(questions,state);} };
    document.getElementById('submit').onclick = ()=>{ const v = document.querySelector('input[name=choice]:checked'); if(v) state.answers[state.qIndex]=v.value; if(confirm('提出してよいですか？')) finishExam(questions,state); };

    // timer
    const tSpan = document.getElementById('t');
    let remaining = state.remaining;
    const iv = setInterval(()=>{
      remaining--; state.remaining = remaining;
      const mm = String(Math.floor(remaining/60)).padStart(2,'0');
      const ss = String(remaining%60).padStart(2,'0');
      tSpan.textContent = mm+':'+ss;
      if(remaining<=0){ clearInterval(iv); alert('時間切れです。自動提出します'); finishExam(questions,state); }
    },1000);
  }

  function finishExam(questions,state){
    // score
    let score = 0; const total = questions.length;
    const details = questions.map((q,idx)=>{
      const userAns = state.answers[idx];
      const correct = q.choices.find(c=>c.isCorrect).label;
      const isCorrect = userAns===correct;
      if(isCorrect) score++;
      return {index: idx+1, text: q.text, userAns, correct, isCorrect, explanation: q.explanation, choices:q.choices};
    });
    const result = {date:new Date().toLocaleString(), score, total, title: cfg.title, details};
    history.push(result); localStorage.setItem(cfg.examKey + ':history', JSON.stringify(history));
    showResult(result);
  }

  function showResult(result){
    root.innerHTML = `<div id="container"><h1>${cfg.title} - 結果</h1><p>実施日: ${result.date}</p><p>得点: ${result.score} / ${result.total}</p><button id="back" class="secondary">戻る</button><h2>問題別結果</h2>${result.details.map(d=>`<div class="q"><p><b>問題 ${d.index}</b> ${d.text}</p><p>あなたの解答: ${d.userAns || '未回答'} ${d.isCorrect? '✅正解':'❌不正解 (正答: '+d.correct+')'}</p><div><b>解説</b><p>${d.explanation}</p></div></div>`).join('')}</div>`;
    document.getElementById('back').onclick = renderLanding;
  }

  // initial render
  renderLanding();
})();
