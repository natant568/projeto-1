import React, { useState } from "react";

export default function BloodFlowBoard() {
  const ROWS = 9;
  const COLS = 7;

  const makeGrid = () => Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => ({ r, c, wall: false })));

  const [grid, setGrid] = useState(makeGrid);
  const startA = { r: 0, c: Math.floor(COLS / 2) };
  const startB = { r: ROWS - 1, c: Math.floor(COLS / 2) };

  const [posA, setPosA] = useState(startA);
  const [posB, setPosB] = useState(startB);

  const MAX_WALLS = 10;
  const [wallsRemaining, setWallsRemaining] = useState(MAX_WALLS);

  const [turn, setTurn] = useState("A");
  const [mode, setMode] = useState("move");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("Bem-vindo — é a vez do jogador A.");
  const [gameOver, setGameOver] = useState(false);

  const cloneGrid = () => grid.map(row => row.map(cell => ({ ...cell })));

  function cellKey(r, c) {
    return `${r}-${c}`;
  }

  const occupiedByPawn = (r, c) => (posA.r === r && posA.c === c) || (posB.r === r && posB.c === c);

  function validMovesFrom(pos) {
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    return deltas
      .map(([dr, dc]) => ({ r: pos.r + dr, c: pos.c + dc }))
      .filter(p => p.r >= 0 && p.r < ROWS && p.c >= 0 && p.c < COLS)
      .filter(p => !grid[p.r][p.c].wall)
      .filter(p => !(posA.r === p.r && posA.c === p.c) && !(posB.r === p.r && posB.c === p.c));
  }

  function isBlocked(player) {
    const p = player === "A" ? posA : posB;
    return validMovesFrom(p).length === 0;
  }

  function onCellClick(r, c) {
    if (gameOver) return;

    if (mode === "wall") {
      if (grid[r][c].wall) {
        setMessage("Já existe um coágulo nesta posição.");
        return;
      }
      if (occupiedByPawn(r, c)) {
        setMessage("Não é possível formar um coágulo na mesma casa do sangue (peão).");
        return;
      }
      if (wallsRemaining <= 0) {
        setMessage("Estoque de muros esgotado — atenção: risco de AVC hemorrágico!");
        return;
      }

      const g = cloneGrid();
      g[r][c].wall = true;
      setGrid(g);
      setWallsRemaining(wallsRemaining - 1);
      setMessage(`Jogador ${turn} colocou um coágulo em (${r + 1}, ${c + 1}).`);

      if (wallsRemaining - 1 <= 0) {
        setGameOver(true);
        setMessage("AVC hemorrágico: todos os coágulos foram consumidos — jogo encerrado.");
        return;
      }

      setTurn(turn === "A" ? "B" : "A");
      return;
    }

    const myPos = turn === "A" ? posA : posB;
    if (!selected) {
      if (myPos.r === r && myPos.c === c) {
        setSelected({ r, c });
        setMessage("Peça selecionada — escolha onde mover (1 célula ortogonal).");
      } else {
        setMessage("Selecione sua própria peça para mover.");
      }
      return;
    }

    const moves = validMovesFrom(selected);
    const canMoveHere = moves.some(m => m.r === r && m.c === c);
    if (!canMoveHere) {
      setSelected(null);
      setMessage("Movimento inválido — selecione novamente.");
      return;
    }

    if (turn === "A") setPosA({ r, c }); else setPosB({ r, c });

    setSelected(null);

    if (turn === "A" && r === ROWS - 1) {
      setGameOver(true);
      setMessage("Jogador A atravessou o vaso — vitória do sangue arterial (A)!");
      return;
    }
    if (turn === "B" && r === 0) {
      setGameOver(true);
      setMessage("Jogador B atravessou o vaso — vitória do sangue venoso (B)!");
      return;
    }

    if (isBlocked(turn === "A" ? "B" : "A")) {
      setGameOver(true);
      setMessage(`Jogador ${turn} bloqueou completamente o oponente — vitória por oclusão!`);
      return;
    }

    setTurn(turn === "A" ? "B" : "A");
    setMessage(`Movimento feito. Agora é a vez do jogador ${turn === "A" ? "B" : "A"}.`);
  }

  function resetGame() {
    setGrid(makeGrid());
    setPosA(startA);
    setPosB(startB);
    setWallsRemaining(MAX_WALLS);
    setTurn("A");
    setMode("move");
    setSelected(null);
    setMessage("Jogo reiniciado — é a vez do jogador A.");
    setGameOver(false);
  }

  function renderCell(cell) {
    const { r, c } = cell;
    const isA = posA.r === r && posA.c === c;
    const isB = posB.r === r && posB.c === c;
    const isSelected = selected && selected.r === r && selected.c === c;

    return (
      <button
        key={cellKey(r, c)}
        onClick={() => onCellClick(r, c)}
        className={`w-12 h-12 flex items-center justify-center border rounded-md transition-shadow focus:outline-none ${
          cell.wall ? "bg-gradient-to-br from-gray-400 to-gray-600" : "bg-white"
        } ${isSelected ? "ring-4 ring-yellow-300" : ""}`}
        title={`(${r + 1}, ${c + 1}) ${cell.wall ? "Coágulo" : "Livre"}`}>
        {cell.wall && <span className="text-xs font-semibold">💠</span>}
        {isA && (
          <div className="flex flex-col items-center">
            <div className="text-xs">A</div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border">🩸</div>
          </div>
        )}
        {isB && (
          <div className="flex flex-col items-center">
            <div className="text-xs">B</div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border">🩸</div>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-3">Fluxo Sanguíneo — Protótipo de Tabuleiro</h1>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="p-2 bg-white rounded shadow">Modo: <strong>{mode === "move" ? "Mover peão" : "Colocar coágulo (muro)"}</strong></div>
            <button onClick={() => setMode("move")} className="px-3 py-1 rounded bg-slate-100">Modo mover</button>
            <button onClick={() => setMode("wall")} className="px-3 py-1 rounded bg-slate-100">Modo coágulo</button>
            <button onClick={resetGame} className="ml-auto px-3 py-1 rounded bg-red-100">Reiniciar</button>
          </div>

          <div className="bg-gradient-to-b from-blue-50 to-white p-4 rounded shadow">
            <div className="grid grid-rows-9 gap-1" style={{ gridTemplateRows: `repeat(${ROWS}, auto)` }}>
              {grid.map((row, r) => (
                <div key={`row-${r}`} className="flex gap-1 justify-center">
                  {row.map(cell => renderCell(cell))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-3 items-center">
            <div>Vez: <strong>{turn}</strong></div>
            <div>Muros restantes: <strong>{wallsRemaining}</strong></div>
            <div className="text-sm text-gray-600">(Se os muros chegarem a 0 -&gt; AVC hemorrágico: jogo encerra por tema.)</div>
          </div>

          <div className="mt-3 p-2 bg-white rounded shadow">
            <div className="font-semibold">Status</div>
            <div className="text-sm">{message}</div>
          </div>
        </div>

        <div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Regras e explicação (detalhadas)</h2>

            <div className="prose text-sm">
              <p>Este protótipo representa um vaso sanguíneo em que dois jogadores controlam o fluxo em direções opostas. O jogo tem foco didático — cada ação tem analogia fisiológica:</p>

              <h3>Componentes</h3>
              <ul>
                <li><strong>Tabuleiro:</strong> grade retangular (neste protótipo: {ROWS}x{COLS}).</li>
                <li><strong>Peões:</strong> duas peças — Jogador A (topo) e Jogador B (base). Representam o fluxo de sangue em direções opostas.</li>
                <li><strong>Muros (coágulos):</strong> peças colocáveis que bloqueiam células do tabuleiro.</li>
                <li><strong>Estoque de muros:</strong> total compartilhado ({MAX_WALLS}).</li>
              </ul>

              <h3>Objetivo</h3>
              <p>Cada jogador busca <em>ou</em> atravessar o vaso até a base oposta (chegar à linha inicial do adversário) <strong>ou</strong> impedir que o adversário tenha movimentos válidos (bloqueio). Tematicamente: representar sucesso de fluxo vs. oclusão. Se o estoque de muros for totalmente consumido, por tema o jogo termina como "AVC hemorrágico".</p>

              <h3>Turnos e Ações</h3>
              <ol>
                <li>Jogadores alternam turnos; começa o Jogador A (topo).</li>
                <li>Em cada turno, o jogador escolhe **uma** das ações:
                  <ul>
                    <li><strong>Mover um peão:</strong> selecionar sua própria peça e mover para uma célula orthogonal adjacente (N, S, E, W) que não contenha muro ou outro peão.</li>
                    <li><strong>Colocar um muro (coágulo):</strong> escolher uma célula vazia e sem peão; o muro permanece e consome 1 do estoque.</li>
                  </ul>
                </li>
                <li>Não é permitido mover diagonalmente, saltar muros, ou colocar muros onde já exista um peão ou outro muro.</li>
              </ol>

              <h3>Condições de vitória / término</h3>
              <ul>
                <li><strong>Travessia:</strong> Se um jogador move seu peão até a linha inicial do oponente, vence (representa o sangue alcançando a extremidade oposta).</li>
                <li><strong>Bloqueio completo:</strong> Se no fim de um movimento o oponente não possuir nenhum movimento válido, o jogador que causou o bloqueio vence.</li>
                <li><strong>AVC hemorrágico (tema):</strong> Se o estoque de muros chegar a 0, o jogo é finalizado como "AVC hemorrágico" — condição temática que encerra a partida sem declarar um vencedor direto (ou pode ser usada como condição de desempate por acordo).</li>
              </ul>

              <h3>Estratégia e variações sugeridas</h3>
              <ul>
                <li>Diminuir ou aumentar o estoque de muros para ajustar a duração e o equilíbrio.</li>
                <li>Permitir movimentos de dois espaços em linha reta como variante (representa fluxo acelerado), ou adicionar cartas de evento (p.ex. "anti-coagulante" que remove um muro).</li>
                <li>Modo cooperativo: jogadores tentam levar um peão até o centro do tabuleiro sem consumir todo o estoque (boa para atividades educativas).</li>
              </ul>

              <h3>Anotações para uso acadêmico</h3>
              <p>Este protótipo foi pensado para fins pedagógicos e pode ser integrado ao seu trabalho sobre biomecânica do ato de morder/embriologia/AVC como um exercício de analogia: muros = coágulos/oclusões, excesso de intervenção = risco hemorrágico, travessia bem-sucedida = fluxo preservado.</p>

              <p className="text-xs text-gray-600">(Este é um protótipo funcional — se quiser, eu adapto para exportar como imagem estática ou PDF, ou faço versão com regras formatadas em ABNT para o seu trabalho.)</p>
            </div>

          </div>

          <div className="mt-4 p-3 bg-white rounded shadow">
            <h3 className="font-semibold">Controles rápidos</h3>
            <ul className="text-sm">
              <li>Alterar modo: clique nos botões "Modo mover" / "Modo coágulo".</li>
              <li>Mover: selecione sua peça (clique) e depois clique na célula destino adjacente.</li>
              <li>Colocar coágulo: escolha uma célula vazia no modo coágulo.</li>
              <li>Reiniciar: botão "Reiniciar".</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
